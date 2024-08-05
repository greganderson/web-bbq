interface Question {
  id: number,
  student: string,
  question: string
};

interface Response {
  student: string,
  message: string,
}

export type { Response, Question };
