import { SectionTitle } from '../ui/SectionTitle';
import { Button } from '../ui/Button';
import { StatusMsg } from '../ui/StatusMsg';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { useDriveSync } from '../../hooks/useDriveSync';

export function GoogleSection() {
  const { connected, connect, disconnect } = useGoogleAuth();
  const { status, syncNow } = useDriveSync(connected);

  return (
    <>
      <SectionTitle>Google</SectionTitle>
      <div className="w-full bg-surface border-[1.5px] border-border rounded-app p-5 flex flex-col gap-3">
        <p className="text-[13px] text-muted leading-[1.6]">
          התחבר כדי לשמור רשימות ל-Google Tasks ולסנכרן את הנתונים בין המכשירים שלך.
        </p>
        {connected ? (
          <>
            <StatusMsg kind="ok">✓ מחובר ל-Google</StatusMsg>
            <Button variant="accent" onClick={syncNow} className="w-full">סנכרן עכשיו</Button>
            <StatusMsg kind={status.kind}>{status.msg}</StatusMsg>
            <button
              className="rounded-xl font-semibold text-[15px] cursor-pointer transition-all duration-150 px-[18px] min-h-12 border-none w-full bg-[#374151] text-[#9ca3af]"
              onClick={disconnect}
            >
              התנתק
            </button>
          </>
        ) : (
          <>
            <Button variant="google" onClick={connect}>
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.5-1.45-.79-3-.79-4.59s.29-3.14.79-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              </svg>
              התחבר עם Google
            </Button>
            <StatusMsg />
          </>
        )}
      </div>
    </>
  );
}
