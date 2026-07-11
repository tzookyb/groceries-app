export type StatusKind = '' | 'ok' | 'err';

const KIND_CLASSES: Record<StatusKind, string> = {
  '': 'text-muted',
  ok: 'text-accent',
  err: 'text-red',
};

export function StatusMsg({ children, kind = '' }: { children?: React.ReactNode; kind?: StatusKind }) {
  return <div className={`text-[13px] text-center min-h-5 ${KIND_CLASSES[kind]}`}>{children}</div>;
}
