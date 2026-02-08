import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { CurriculumProvider } from './context/CurriculumContext';
import { SubmissionProvider } from './context/SubmissionContext';
import { StudentsProvider } from './context/StudentsContext';
import { TimetableProvider } from './context/TimetableContext';
import { QuizProvider } from './context/QuizContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ManageStudents from './pages/ManageStudents';
import StudentProfileView from './pages/StudentProfileView';
import CurriculumIngestion from './pages/CurriculumIngestion';
import ProjectManagement from './pages/ProjectManagement';
import TeacherQuizzes from './pages/TeacherQuizzes';
import StudentLearning from './pages/StudentLearning';
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
import Diagnostic from './pages/Diagnostic';
import Inventory from './pages/Inventory';
import Timetable from './pages/Timetable';
import BookingAndLoans from './pages/BookingAndLoans';

import { ResourceProvider } from './context/ResourceContext';

function App() {
  return (
    <UserProvider>
      <ResourceProvider>
        <CurriculumProvider>
          <SubmissionProvider>
            <QuizProvider>
              <StudentsProvider>
                <TimetableProvider>
                  <BrowserRouter>
                    <Routes>
                      <Route path="/diagnostic" element={<Diagnostic />} />
                      <Route path="/login" element={<Login />} />

                      {/* Student Routes */}
                      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                        <Route path="/student" element={<Layout />}>
                          <Route index element={<StudentDashboard />} />
                          <Route path="learning" element={<StudentLearning />} />
                          <Route path="project/:id" element={<ProjectBriefView />} />
                          <Route path="task/:taskId" element={<TaskSubmission />} />
                          <Route path="resources" element={<BookingAndLoans />} />
                          {/* Redirects for old routes */}
                          <Route path="booking" element={<Navigate to="/student/resources" replace />} />
                          <Route path="equipment" element={<Navigate to="/student/resources" replace />} />

                          <Route path="store" element={<DowdBucksStore />} />
                          <Route path="inventory" element={<Inventory />} />
                          <Route path="projects" element={<Projects />} />
                          <Route path="grades" element={<Grades />} />
                          <Route path="*" element={<Navigate to="/student" replace />} />
                        </Route>
                      </Route>

                      {/* Teacher Routes - Reusing Layout for now, might need custom items later */}
                      <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
                        <Route path="/teacher" element={<Layout />}>
                          <Route index element={<TeacherDashboard />} />
                          <Route path="students" element={<ManageStudents />} />
                          <Route path="students/:id" element={<StudentProfileView />} />
                          <Route path="projects" element={<ProjectManagement />} />
                          <Route path="quizzes" element={<TeacherQuizzes />} />
                          <Route path="resources" element={<BookingAndLoans />} />
                          {/* Redirects for old routes */}
                          <Route path="booking" element={<Navigate to="/teacher/resources" replace />} />
                          <Route path="equipment" element={<Navigate to="/teacher/resources" replace />} />
                          <Route path="ingestion" element={<CurriculumIngestion />} />
                          <Route path="assessment" element={<AssessmentHub />} />
                          <Route path="assessment/:submissionId" element={<AssessmentView />} />
                          <Route path="setup" element={<AcademicYearSetup />} />
                          <Route path="qa" element={<QualityAssurance />} />
                          <Route path="*" element={<Navigate to="/teacher" replace />} />
                        </Route>
                      </Route>

                      {/* Shared Routes */}
                      <Route path="/profile" element={<Layout />}>
                        <Route index element={<Profile />} />
                      </Route>
                      <Route path="/calendar" element={<Layout />}>
                        <Route index element={<Calendar />} />
                      </Route>
                      <Route path="/timetable" element={<Layout />}>
                        <Route index element={<Timetable />} />
                      </Route>
                      <Route path="/support" element={<Layout />}>
                        <Route index element={<Support />} />
                      </Route>

                      {/* Redirects */}
                      <Route path="/AdminDashboard" element={<Navigate to="/teacher" replace />} />
                      <Route path="/" element={<Navigate to="/login" replace />} />
                    </Routes>
                  </BrowserRouter>
                </TimetableProvider>
              </StudentsProvider>
            </QuizProvider>
          </SubmissionProvider>
        </CurriculumProvider>
      </ResourceProvider>
    </UserProvider>
  );
}

export default App;
