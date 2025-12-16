'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 에러 로깅
    console.error('❌ 전역 에러 발생:', {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      name: error.name,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    });
  }, [error]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        background: '#fff',
        borderRadius: '1rem',
        padding: '2rem',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ color: '#e53e3e', marginBottom: '1rem' }}>
          ⚠️ 오류가 발생했습니다
        </h2>
        
        <p style={{ marginBottom: '1rem', color: '#4a5568' }}>
          죄송합니다. 예상치 못한 오류가 발생했습니다.
        </p>
        
        <details style={{ marginBottom: '1.5rem' }}>
          <summary style={{ 
            cursor: 'pointer', 
            padding: '0.5rem',
            background: '#f7fafc',
            borderRadius: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            오류 상세 정보 (개발자에게 전달해주세요)
          </summary>
          <pre style={{
            background: '#1a202c',
            color: '#e2e8f0',
            padding: '1rem',
            borderRadius: '0.5rem',
            overflow: 'auto',
            fontSize: '0.875rem',
            lineHeight: '1.5'
          }}>
{JSON.stringify({
  message: error.message,
  name: error.name,
  digest: error.digest,
  stack: error.stack,
  timestamp: new Date().toISOString(),
  userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
  url: typeof window !== 'undefined' ? window.location.href : 'unknown'
}, null, 2)}
          </pre>
        </details>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={reset}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              background: '#4a5568',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            다시 시도
          </button>
          
          <button
            onClick={() => {
              const errorInfo = JSON.stringify({
                message: error.message,
                name: error.name,
                digest: error.digest,
                stack: error.stack,
                timestamp: new Date().toISOString(),
                userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
                url: typeof window !== 'undefined' ? window.location.href : 'unknown'
              }, null, 2);
              navigator.clipboard.writeText(errorInfo);
              alert('오류 정보가 클립보드에 복사되었습니다.');
            }}
            style={{
              flex: 1,
              padding: '0.75rem 1.5rem',
              background: '#ed8936',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            📋 오류 정보 복사
          </button>
        </div>
        
        <p style={{ 
          marginTop: '1.5rem', 
          fontSize: '0.875rem', 
          color: '#718096',
          textAlign: 'center'
        }}>
          💡 Tip: 브라우저 콘솔(F12)을 열어 더 자세한 로그를 확인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

