import EventEmitter from "eventemitter3";

export type MessageType = {
  type: string;
  data: any;
};

interface Events {
  message: (payload: MessageType) => void;
}

const emitter = new EventEmitter<Events>();

export default emitter;
