use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug)]
pub struct Firebase {
    pub firebase_token: String,
    pub user_id: String,
}

#[derive(Serialize, Deserialize, Debug)]
enum Type {
    #[serde(rename = "init")]
    Init,

    #[serde(rename = "delete")]
    Delete,

    #[serde(rename = "new")]
    New,

    #[serde(rename = "update")]
    Update,
}

#[derive(Serialize, Deserialize, Debug)]
enum Resource {
    Feedback,
    Question,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(untagged)]
enum DataItem {
    Feedback(Feedback),
    Question(Question),
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Question {
    id: String,
    student: String,
    question: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Feedback {
    student: String,
    feedback: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct Message {
    #[serde(rename = "type")]
    type_: Type,
    resource: Option<Resource>,
    id: Option<String>,
    data: Vec<Vec<DataItem>>,
    #[serde(skip)]
    questions: Vec<Question>,
    #[serde(skip)]
    feedbacks: Vec<Feedback>,
}

impl Message {
    pub fn questions(&self) -> &Vec<Question> {
        &self.questions
    }

    pub fn feedbacks(&self) -> &Vec<Feedback> {
        &self.feedbacks
    }

    pub fn normalize_data(&mut self) {
        for group in self.data.drain(..) {
            for item in group {
                match item {
                    DataItem::Feedback(feedback) => self.feedbacks.push(feedback),
                    DataItem::Question(question) => self.questions.push(question),
                }
            }
        }
    }
}

impl Question {
    pub fn student(&self) -> &String {
        &self.student
    }

    pub fn question(&self) -> &String {
        &self.question
    }
}

impl Feedback {
    pub fn student(&self) -> &String {
        &self.student
    }

    pub fn feedback(&self) -> &String {
        &self.feedback
    }
}
