use crossterm::event::{self, Event, KeyCode};
use futures_util::{stream::SplitStream, stream::StreamExt, SinkExt};
use ratatui::{
    backend::CrosstermBackend,
    layout::{Constraint, Direction, Layout},
    style::{Color, Modifier, Style},
    widgets::{Block, Borders, Paragraph},
    DefaultTerminal,
};
use serde_json;
use std::error::Error;
use std::fs::File;
use std::io::Read;
use std::sync::Arc;
use tokio::net::TcpStream;
use tokio::sync::{mpsc, Mutex};
use tokio_tungstenite::tungstenite::protocol::Message;
use tokio_tungstenite::{connect_async, MaybeTlsStream, WebSocketStream};

mod types;

#[derive(Clone)]
struct AppState {
    tx: mpsc::Sender<String>,
    rx: Arc<Mutex<mpsc::Receiver<String>>>,
}

async fn read_auth() -> Result<types::Firebase, Box<dyn Error>> {
    let mut file = File::open("./firebase-token.json").expect("Unable to open firebase-token.json");
    let mut contents = String::new();
    file.read_to_string(&mut contents)
        .expect("Unable to read file");
    let data: types::Firebase = serde_json::from_str(&contents)?;

    Ok(data)
}

async fn ws_task(
    state: AppState,
    mut read: SplitStream<WebSocketStream<MaybeTlsStream<TcpStream>>>,
) {
    while let Some(message) = read.next().await {
        match message {
            Ok(Message::Text(text)) => {
                state.tx.send(text).await.unwrap();
            }
            Ok(_) => {}
            Err(e) => eprintln!("Error reading: {:?}", e),
        }
    }
}

async fn render_ui(
    terminal: &mut DefaultTerminal,
    message: &types::Message,
) -> Result<(), Box<dyn Error>> {
    let questions = message
        .questions()
        .iter()
        .map(|q| format!("{}: {}", q.student(), q.question()))
        .collect::<Vec<_>>()
        .join("\n");
    let feedbacks = message
        .feedbacks()
        .iter()
        .map(|f| format!("{}: {}", f.student(), f.feedback()))
        .collect::<Vec<_>>()
        .join("\n");

    let chunks = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(50), Constraint::Percentage(50)].as_ref())
        .split(terminal.get_frame().size());

    let question_paragraph = Paragraph::new(questions)
        .block(Block::default().title("Questions").borders(Borders::ALL))
        .style(Style::default().fg(Color::White));
    let feedback_paragraph = Paragraph::new(feedbacks)
        .block(Block::default().title("Feedbacks").borders(Borders::ALL))
        .style(Style::default().fg(Color::White));

    terminal.draw(|f| {
        f.render_widget(question_paragraph, chunks[0]);
        f.render_widget(feedback_paragraph, chunks[1]);
    })?;

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
    let firebase = read_auth().await?;
    let (tx, rx) = mpsc::channel::<String>(100);

    let state = AppState {
        tx,
        rx: Arc::new(Mutex::new(rx)),
    };

    let url = format!(
        "ws://localhost:8000/ws/teacher?token={}",
        firebase.firebase_token
    );

    let mut terminal = ratatui::init();
    terminal.clear()?;

    let (ws_stream, _) = connect_async(url).await?;
    let (mut write, read) = ws_stream.split();
    // println!("Connected!");

    tokio::spawn(ws_task(state.clone(), read));

    loop {
        let mut rx = state.rx.lock().await;

        if let Ok(message) = rx.try_recv() {
            match serde_json::from_str::<types::Message>(&message) {
                Ok(mut data) => {
                    data.normalize_data();
                    render_ui(&mut terminal, &data).await?;
                }
                Err(e) => {
                    eprintln!("Failed to deserialize: {}", e);
                    println!("{}", message);
                }
            }
        }
    }

    ratatui::restore();
}
