
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { LanguageProvider } from './context/LanguageContext';
import { CurriculumProvider } from './context/CurriculumContext';
import { SubmissionProvider } from './context/SubmissionContext';
import { StudentsProvider } from './context/StudentsContext';
import { TimetableProvider } from './context/TimetableContext';
import { QuizProvider } from './context/QuizContext';
import { AssessmentProvider } from './context/AssessmentContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard.tsx';
import ManageStudents from './pages/ManageStudents';
import StudentProfileView from './pages/StudentProfileView';
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
import SetSecurePassword from './pages/SetSecurePassword';

import { AchievementsProvider } from './context/AchievementsContext';
import StudentAchievements from './pages/StudentAchievements';
import TeacherAchievements from './pages/TeacherAchievements';
import { ResourceProvider } from './context/ResourceContext';
import { ERCProvider } from './context/ERCContext';
import ERCRecordsHub from './pages/ERCRecords/ERCRecordsHub';
import ERCProjects from './pages/ERCRecords/ERCProjects';
import ERCBookings from './pages/ERCRecords/ERCBookings';
import PerformingArtsHub from './pages/PerformingArtsHub'; // Added

import ErrorBoundary from './components/common/ErrorBoundary';
import { NotificationProvider } from './context/NotificationContext';
import DueDateChecker from './components/tools/DueDateChecker';

function App() {
  return (
    <ErrorBoundary>
      <UserProvider>
        <NotificationProvider>
          <LanguageProvider>
            <ResourceProvider>
              <CurriculumProvider>
                <SubmissionProvider>
                  <QuizProvider>
                    <StudentsProvider>
                      <TimetableProvider>
                        <AchievementsProvider>
                          <AssessmentProvider>
                            <ERCProvider>
                              <BrowserRouter>
                                <DueDateChecker />
                                <Routes>
                                  {/* Public Routes */}
                                  <Route path="/diagnostic" element={<Diagnostic />} />
                                  <Route path="/login" element={<Login />} />
                                  <Route path="/" element={<Navigate to="/login" replace />} />

                                  {/* Protected Route for Password Change */}
                                  <Route element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin']} />}>
                                    <Route path="/set-password" element={<SetSecurePassword />} />
                                  </Route>

                                  {/* Student Routes */}
                                  <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                                    <Route path="/student" element={<Layout />}>
                                      <Route index element={<StudentDashboard />} />
                                      <Route path="learning" element={<StudentLearning />} />
                                      <Route path="achievements" element={<StudentAchievements />} />
                                      <Route path="project/:id" element={<ProjectBriefView />} />
                                      <Route path="task/:taskId" element={<TaskSubmission />} />
                                      <Route path="resources" element={<BookingAndLoans />} />
                                      <Route path="performing-arts" element={<PerformingArtsHub />} /> {/* Added */}
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

                                  {/* Teacher Routes */}
                                  <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin']} />}>
                                    <Route path="/teacher" element={<Layout />}>
                                      <Route index element={<TeacherDashboard />} />
                                      <Route path="students" element={<ManageStudents />} />
                                      <Route path="students/:id" element={<StudentProfileView />} />
                                      <Route path="projects" element={<ProjectManagement />} />
                                      <Route path="quizzes" element={<TeacherQuizzes />} />
                                      <Route path="achievements" element={<TeacherAchievements />} />
                                      <Route path="resources" element={<BookingAndLoans />} />
                                      {/* Redirects for old routes */}
                                      <Route path="booking" element={<Navigate to="/teacher/resources" replace />} />
                                      <Route path="equipment" element={<Navigate to="/teacher/resources" replace />} />
                                      <Route path="assessment" element={<AssessmentHub />} />
                                      <Route path="assessment/:submissionId" element={<AssessmentView />} />
                                      <Route path="setup" element={<AcademicYearSetup />} />
                                      <Route path="qa" element={<QualityAssurance />} />
                                      <Route path="*" element={<Navigate to="/teacher" replace />} />
                                    </Route>
                                  </Route>

                                  {/* Admin Routes */}
                                  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                                    <Route path="/admin" element={<Layout />}>
                                      <Route index element={<AdminDashboard />} />
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
                                  <Route path="/erc" element={<Layout />}>
                                    <Route index element={<ERCRecordsHub />} />
                                    <Route path="projects" element={<ERCProjects />} />
                                    <Route path="bookings" element={<ERCBookings />} />
                                  </Route>
                                  <Route path="/support" element={<Layout />}>
                                    <Route index element={<Support />} />
                                  </Route>
                                </Routes>
                              </BrowserRouter>
                            </ERCProvider>
                          </AssessmentProvider>
                        </AchievementsProvider>
                      </TimetableProvider>
                    </StudentsProvider>
                  </QuizProvider>
                </SubmissionProvider>
              </CurriculumProvider>
            </ResourceProvider>
          </LanguageProvider>
        </NotificationProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;
