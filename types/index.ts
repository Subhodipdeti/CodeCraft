export type EventCallback = <T, E>(
  event: React.MouseEvent<T, E> | React.KeyboardEvent<T>
) => void;
