import React from 'react';

interface LoaderProps {
  message?: string;
  inline?: boolean;
}

const Loader: React.FC<LoaderProps> = ({ message = 'Processing, please wait...', inline = false }) => {
  if (inline) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          padding: '1rem', 
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          marginTop: '1rem'
        }}
      >
        <div 
          className="spinner" 
          style={{
            width: '20px',
            height: '20px',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} 
        />
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {message}
        </span>
      </div>
    );
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(7, 10, 18, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.25rem',
        zIndex: 99999,
        animation: 'modalOverlayFadeIn 0.25s ease forwards'
      }}
    >
      <div 
        style={{
          position: 'relative',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Outer pulsing glass ring */}
        <div 
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '4px solid rgba(16, 185, 129, 0.1)',
            borderRadius: '50%',
          }} 
        />
        {/* Active spinning ring */}
        <div 
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '4px solid transparent',
            borderTopColor: '#10b981',
            borderRightColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.45))'
          }} 
        />
      </div>
      {message && (
        <p 
          style={{
            margin: 0,
            fontSize: '0.95rem',
            fontWeight: 600,
            color: '#fff',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '0.5rem 1.25rem',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default Loader;
