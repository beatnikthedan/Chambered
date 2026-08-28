import React from 'react'

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isSaving: boolean;
  saveSuccess: boolean;
  isEditMode: boolean;
  createLabel?: string;
  updateLabel?: string;
  savingLabel?: string;
  successLabel?: string;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export default function SubmitButton({
  isSaving,
  saveSuccess,
  isEditMode,
  createLabel = 'Create',
  updateLabel = 'Update',
  savingLabel = 'Saving...',
  successLabel = '✓ Saved!',
  disabled = false,
  className = 'btn btn-primary',
  style = {},
  ...props
}: SubmitButtonProps) {
  const resolvedClassName = saveSuccess 
    ? className.replace('btn-primary', 'btn-success') 
    : className;

  return (
    <button
      type="submit"
      className={resolvedClassName}
      disabled={isSaving || disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        minWidth: '100px',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        ...style
      }}
      {...props}
    >
      {isSaving ? (
        <>
          <span className="spinner-mini"></span>
          <span>{savingLabel}</span>
        </>
      ) : saveSuccess ? (
        <span style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '4px', 
          fontWeight: 'bold',
          animation: 'scale-up 0.2s ease'
        }}>
          {successLabel}
        </span>
      ) : isEditMode ? (
        updateLabel
      ) : (
        createLabel
      )}
    </button>
  )
}
