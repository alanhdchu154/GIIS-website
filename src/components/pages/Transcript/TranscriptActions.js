import React from 'react';

function TranscriptActions({ canSave, canExport, remoteSaving, profile, language, onSave, onExport }) {
  return (
    <>
      {canSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={remoteSaving || !profile}
          style={{
            marginTop: '15px',
            marginRight: '10px',
            padding: '10px 20px',
            backgroundColor: 'rgba(213, 168, 54, 1)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: remoteSaving ? 'wait' : 'pointer',
          }}
        >
          {remoteSaving
            ? (language === 'en' ? 'Saving…' : '储存中…')
            : (language === 'en' ? 'Save transcript' : '储存成绩单')}
        </button>
      )}
      {canExport && (
        <button
          type="button"
          onClick={onExport}
          style={{
            marginTop: '15px',
            padding: '10px 20px',
            backgroundColor: 'rgba(43, 61, 109, 0.8)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          {language === 'en' ? 'Export to PDF' : '汇出 PDF'}
        </button>
      )}
    </>
  );
}

export default TranscriptActions;
