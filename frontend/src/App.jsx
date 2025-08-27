import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Catalog from "./pages/Catalog";
import Admin from "./pages/Admin";
import AddEditPhone from "./pages/AddEditPhone";
import Logs from "./pages/Logs";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/phone/add" element={<AddEditPhone />} />
          <Route path="/phone/:id/edit" element={<AddEditPhone />} />
          <Route path="/logs" element={<Logs />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
