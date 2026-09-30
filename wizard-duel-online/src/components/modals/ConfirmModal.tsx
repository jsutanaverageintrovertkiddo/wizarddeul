interface ConfirmModalProps {
  readonly isOpen: boolean;
  readonly title: string;
  readonly message: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly confirmLabel?: string;
}

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <>
      <div className='modal fade show d-block' data-bs-backdrop='static' tabIndex={-1}>
        <div className='modal-dialog modal-dialog-centered modal-sm'>
          <div className='modal-content bg-modal'>
            <div className='modal-header border-0'>
              <h4 className='modal-title w-100 text-center font-bold'>{title}</h4>
            </div>
            <div className='modal-body'>
              <p className='text-center mb-0'>{message}</p>
            </div>
            <div className='modal-footer border-0 justify-content-center'>
              <button type='button' className='btn btn-secondary' onClick={onCancel}>
                Cancel
              </button>
              <button type='button' className='btn btn-dark' onClick={onConfirm}>
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className='modal-backdrop fade show'></div>
    </>
  );
};