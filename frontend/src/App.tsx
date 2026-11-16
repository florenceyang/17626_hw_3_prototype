import { Layout } from "./components/Layout";
import { Account } from "./pages/Account";
import { Confirmation } from "./pages/Confirmation";
import { IntakeForm } from "./pages/IntakeForm";
import { StaffList } from "./pages/StaffList";
import { Welcome } from "./pages/Welcome";
import { useRoute } from "./router";
import { IntakeProvider } from "./state/intakeStore";

// T011/T051: hash routes from contracts/ui-screens.md. The staff list is a staff view, so it has no SafetyBar.
function Routes() {
  const route = useRoute();
  switch (route) {
    case "form":
      return (
        <Layout applicant>
          <IntakeForm />
        </Layout>
      );
    case "confirmation":
      return (
        <Layout applicant>
          <Confirmation />
        </Layout>
      );
    case "account":
      return (
        <Layout applicant>
          <Account />
        </Layout>
      );
    case "staff":
      return (
        <Layout applicant={false}>
          <StaffList />
        </Layout>
      );
    default:
      return (
        <Layout applicant>
          <Welcome />
        </Layout>
      );
  }
}

export default function App() {
  return (
    <IntakeProvider>
      <Routes />
    </IntakeProvider>
  );
}
