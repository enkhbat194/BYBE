import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import CenterPanel from './CenterPanel';

export default function MainContent() {
  return (
    <div className="main-content">
      <LeftSidebar />
      <CenterPanel />
      <RightSidebar />
    </div>
  );
}
