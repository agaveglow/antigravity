import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { CurriculumProvider } from './context/CurriculumContext';
import { SubmissionProvider } from './context/SubmissionContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ManageStudents from './pages/ManageStudents';
import StudentProfileView from './pages/StudentProfileView';
import CurriculumIngestion from './pages/CurriculumIngestion';
import ProjectManagement from './pages/ProjectManagement';
import ProjectBriefView from './pages/ProjectBriefView';
import TaskSubmission from './pages/TaskSubmission';
import DowdBucksStore from './pages/DowdBucksStore';
import AssessmentHub from './pages/AssessmentHub';
import AssessmentView from './pages/AssessmentView';
import AcademicYearSetup from './pages/AcademicYearSetup';
import QualityAssurance from './pages/QualityAssurance';
import Support from './pages/Support';
import Login from './pages/Login';
import Projects from './pages/Projects';
import Grades from './pages/Grades';
import Profile from './pages/Profile';
import Calendar from './pages/Calendar';

function App() {
  return (
    <UserProvider>
      <CurriculumProvider>
        <SubmissionProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/student" element={<Layout />}>
                  <Route index element={<StudentDashboard />} />
                  <Route path="project/:id" element={<ProjectBriefView />} />
                  <Route path="task/:taskId" element={<TaskSubmission />} />
                  <Route path="store" element={<DowdBucksStore />} />
                  <Route path="projects" element={<Projects />} />
                  <Route path="grades" element={<Grades />} />
                </Route>
              </Route>

              {/* Teacher Routes - Reusing Layout for now, might need custom items later */}
              <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
                <Route path="/teacher" element={<Layout />}>
                  <Route index element={<TeacherDashboard />} />
                  <Route path="students" element={<ManageStudents />} />
                  <Route path="students/:id" element={<StudentProfileView />} />
                  <Route path="projects" element={<ProjectManagement />} />
                  <Route path="ingestion" element={<CurriculumIngestion />} />
                  <Route path="assessment" element={<AssessmentHub />} />
                  <Route path="assessment/:submissionId" element={<AssessmentView />} />
                  <Route path="setup" element={<AcademicYearSetup />} />
                  <Route path="qa" element={<QualityAssurance />} />
                </Route>
              </Route>

              <Route path="/profile" element={<Layout />}>
                <Route index element={<Profile />} />
              </Route>

              <Route path="/calendar" element={<Layout />}>
                <Route index element={<Calendar />} />
              </Route>

              {/* Shared Route */}
              <Route path="/support" element={<Layout />}>
                <Route index element={<Support />} />
              </Route>

              {/* Redirect root based on role is handled in Login or individual guards, but for now: */}
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </SubmissionProvider>
      </CurriculumProvider>
    </UserProvider>
  );
}
// Force recompile

export default App;
