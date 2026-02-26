export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary tracking-tight">TrackTrail</h1>
          <p className="text-sm text-foreground/60 mt-1">Tu camino, tu ritmo</p>
        </div>
        {children}
      </div>
    </div>
  );
}
