const LoadingSpinner = ({ message = 'Loading...' }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
      gap: '1rem',
    }}
  >
    <div style={{ position: 'relative', width: 48, height: 48 }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: '2px solid rgba(0,229,255,0.1)',
          borderRadius: '50%',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: '2px solid transparent',
          borderTopColor: 'var(--cyan)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 8,
          border: '1.5px solid transparent',
          borderTopColor: 'rgba(0,229,255,0.4)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite reverse',
        }}
      />
    </div>
    <p
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        letterSpacing: '0.12em',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
      }}
    >
      {message}
    </p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);
export default LoadingSpinner;
