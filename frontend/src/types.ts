interface Question {
  id: number,
  student: string,
  question: string
}

interface Response {
  student: string,
  feedback: string,
}

interface WebsocketResponse {
  type: string,
  resource: string,
  id: number | null,
  data: [ Response[], Question[] ]
}

export type { Response, Question, WebsocketResponse };
