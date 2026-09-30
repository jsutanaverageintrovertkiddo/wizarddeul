import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { BattleScreen } from './components/board/BattleScreen';
import { MainMenu } from './components/board/MainMenu';
import { WaitingRoom } from './components/lobby/WaitingRoom';

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<MainMenu />} />
        <Route path='/room/:code' element={<WaitingRoom />} />
        <Route path='/battle/:matchID' element={<BattleScreen />} />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  );
};