import Layout from './components/Layout'
import { useStore } from './store/StoreContext'
import { useRoute } from './router'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentDetail from './pages/StudentDetail'
import Groups from './pages/Groups'
import GroupDetail from './pages/GroupDetail'
import Teachers from './pages/Teachers'
import Courses from './pages/Courses'
import Payments from './pages/Payments'
import Attendance from './pages/Attendance'
import Leads from './pages/Leads'
import Expenses from './pages/Expenses'
import Settings from './pages/Settings'
import { Empty } from './components/ui'
import { t } from './i18n'

export default function App() {
  const { session, lang } = useStore()
  const [section = '', id] = useRoute()

  if (!session) return <Login key={lang} />

  let page
  switch (section) {
    case '': page = <Dashboard />; break
    case 'students': page = id ? <StudentDetail id={id} /> : <Students />; break
    case 'groups': page = id ? <GroupDetail id={id} /> : <Groups />; break
    case 'teachers': page = <Teachers />; break
    case 'courses': page = <Courses />; break
    case 'payments': page = <Payments />; break
    case 'attendance': page = <Attendance groupId={id} />; break
    case 'leads': page = <Leads />; break
    case 'expenses': page = <Expenses />; break
    case 'settings': page = <Settings />; break
    default: page = <Empty icon="alert" title={t('common.notFound')} />
  }

  // key={lang} — til almashganda butun interfeys qayta chiziladi
  return (
    <Layout key={lang} active={section}>
      {page}
    </Layout>
  )
}
