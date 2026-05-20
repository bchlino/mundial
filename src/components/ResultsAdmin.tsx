import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const ResultsAdmin: React.FC = () => {
  const [formData, setFormData] = useState({
    homeTeam: '',
    awayTeam: '',
    homeScore: '',
    awayScore: '',
    stage: 'groups',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'matches'), {
        homeTeam: formData.homeTeam,
        awayTeam: formData.awayTeam,
        homeScore: parseInt(formData.homeScore, 10),
        awayScore: parseInt(formData.awayScore, 10),
        stage: formData.stage,
      });
      alert('Resultado agregado exitosamente');
      setFormData({ homeTeam: '', awayTeam: '', homeScore: '', awayScore: '', stage: 'groups' });
    } catch (error) {
      console.error('Error al agregar resultado:', error);
      alert('Hubo un error al agregar el resultado');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Panel de Administración de Resultados</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Equipo Local</label>
          <input
            type="text"
            name="homeTeam"
            value={formData.homeTeam}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Equipo Visitante</label>
          <input
            type="text"
            name="awayTeam"
            value={formData.awayTeam}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Goles Equipo Local</label>
          <input
            type="number"
            name="homeScore"
            value={formData.homeScore}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Goles Equipo Visitante</label>
          <input
            type="number"
            name="awayScore"
            value={formData.awayScore}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Fase</label>
          <select
            name="stage"
            value={formData.stage}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm"
          >
            <option value="groups">Grupos</option>
            <option value="round_of_16">Octavos de Final</option>
            <option value="quarterfinals">Cuartos de Final</option>
            <option value="semifinals">Semifinales</option>
            <option value="final">Final</option>
          </select>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Agregar Resultado
        </button>
      </form>
    </div>
  );
};

export default ResultsAdmin;