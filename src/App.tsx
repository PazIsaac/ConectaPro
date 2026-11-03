import { Route, Routes } from 'react-router-dom'
import './App.css'
import Home from './Home'
import Layout from './Layout'
import Login from './Login'
import MisSolicitudes from './MisSolicitudes'
import NoEncontrado from './NoEncontrado'
import Pago from './Pago'
import PanelProfesional from './PanelProfesional'
import ProfesionalDetalle from './ProfesionalDetalle'
import Profesionales from './Profesionales'
import Registro from './Registro'
import RutaProtegida from './RutaProtegida'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="profesionales" element={<Profesionales />} />
        <Route path="profesionales/:id" element={<ProfesionalDetalle />} />

        <Route element={<RutaProtegida roles={['cliente']} />}>
          <Route path="solicitudes" element={<MisSolicitudes />} />
          <Route path="pago/:solicitudId" element={<Pago />} />
        </Route>

        <Route element={<RutaProtegida roles={['profesional']} />}>
          <Route path="panel" element={<PanelProfesional />} />
        </Route>

        <Route path="*" element={<NoEncontrado />} />
      </Route>
    </Routes>
  )
}

export default App
