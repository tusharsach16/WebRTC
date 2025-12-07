type JoinMessage = {
  type: "join";
  roomId: string;
  userId: string;
};

type OfferMessage = {
  type: "offer";
  roomId: string;
  from: string;
  to: string;
  sdp: RTCSessionDescriptionInit;
};

type AnswerMessage = {
  type: "answer";
  roomId: string;
  from: string;
  to: string;
  sdp: RTCSessionDescriptionInit;
};

type IceCandidateMessage = {
  type: "ice-candidate";
  roomId: string;
  from: string;
  to: string;
  candidate: RTCIceCandidateInit;
};

type ClientMessage =
  | JoinMessage
  | OfferMessage
  | AnswerMessage
  | IceCandidateMessage;

export type {
  JoinMessage,
  OfferMessage,
  AnswerMessage,
  IceCandidateMessage,
  ClientMessage,
};
