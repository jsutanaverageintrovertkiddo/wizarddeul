import { click } from '../../utils/assetUtils';
import { Modal } from './Modal';

interface HelpModalProps {
  readonly showHelpModal: boolean;
  readonly setShowHelpModal: React.Dispatch<React.SetStateAction<boolean>>;
  readonly playAudio: (audio: string) => void;
}

export const HelpModal = ({
  showHelpModal,
  setShowHelpModal,
  playAudio,
}: HelpModalProps) => {
  const handleHelpClose = () => {
    setShowHelpModal(false);
    playAudio(click);
  };

  return (
    <Modal
      title='Game Rules'
      isOpen={showHelpModal}
      onClose={handleHelpClose}
      scrollable={true}
      heightClass='h-50'
    >
      <ol>
        <li className='mb-2'>
          Two wizards duel online in real time - each player takes one turn at a
          time over the network.
        </li>
        <li className='mb-2'>
          The deck is shared and reshuffles when it runs out.
        </li>
        <li className='mb-2'>
          On your turn you draw <b>1</b> card, then play <b>1</b> card. Click a
          card to preview it, then click &quot;End Turn&quot; to play it.
        </li>
        <li className='mb-2'>
          You win the moment your opponent&apos;s HP drops to <b>0</b>.
        </li>
        <li className='mb-2'>
          Cards can damage, heal, buff or debuff. Damage is calculated as:
          (card damage + your attack - opponent&apos;s shield) &times; modifiers.
        </li>
        <li>
          Every <b>11</b> turns all buffs and debuffs are washed away.
        </li>
      </ol>
    </Modal>
  );
};