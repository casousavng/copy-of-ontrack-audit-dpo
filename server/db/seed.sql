-- Seed Data for OnTrack Application

-- Insert Admin User
INSERT INTO users (id, email, fullname, roles) VALUES
(1, 'admin@mousquetaires.com', 'Carlos Oliveira', ARRAY['ADMIN']::user_role[]);

-- Insert AMONT User
INSERT INTO users (id, email, fullname, roles) VALUES
(2, 'amont@mousquetaires.com', 'Ana Costa', ARRAY['AMONT']::user_role[]);

-- Insert DOT Users
INSERT INTO users (id, email, fullname, roles, amont_id, assigned_stores) VALUES
(3, 'dot1@mousquetaires.com', 'João Silva', ARRAY['DOT']::user_role[], 2, ARRAY[1,2,3]),
(4, 'dot2@mousquetaires.com', 'Pedro Martins', ARRAY['DOT']::user_role[], 2, ARRAY[4,5,6]),
(5, 'dot3@mousquetaires.com', 'Sofia Almeida', ARRAY['DOT']::user_role[], 2, ARRAY[7,8]),
(6, 'dot4@mousquetaires.com', 'Rui Santos', ARRAY['DOT']::user_role[], 2, ARRAY[9,10]);

-- Insert Aderente Users
INSERT INTO users (id, email, fullname, roles) VALUES
(11, 'aderente1@intermarche.pt', 'Maria Santos', ARRAY['ADERENTE']::user_role[]),
(12, 'aderente2@intermarche.pt', 'José Oliveira', ARRAY['ADERENTE']::user_role[]),
(13, 'aderente3@intermarche.pt', 'Teresa Lima', ARRAY['ADERENTE']::user_role[]),
(14, 'aderente4@intermarche.pt', 'Carlos Nunes', ARRAY['ADERENTE']::user_role[]),
(15, 'aderente5@intermarche.pt', 'Ana Lopes', ARRAY['ADERENTE']::user_role[]),
(16, 'aderente6@intermarche.pt', 'Miguel Tavares', ARRAY['ADERENTE']::user_role[]),
(17, 'aderente7@intermarche.pt', 'Joana Pinto', ARRAY['ADERENTE']::user_role[]),
(18, 'aderente8@intermarche.pt', 'Bruno Correia', ARRAY['ADERENTE']::user_role[]),
(19, 'aderente9@intermarche.pt', 'Carla Gomes', ARRAY['ADERENTE']::user_role[]),
(20, 'aderente10@intermarche.pt', 'Vasco Ribeiro', ARRAY['ADERENTE']::user_role[]);

-- Insert Stores
INSERT INTO stores (id, codehex, brand, size, city, gpslat, gpslong, dot_user_id, aderente_id) VALUES
(1, 'LOJ001', 'Intermarché', 'Super', 'Odivelas', 38.79, -9.17, 3, 11),
(2, 'LOJ002', 'Intermarché', 'Contact', 'Alfragide', 38.73, -9.21, 3, 12),
(3, 'LOJ003', 'Bricomarché', 'Média', 'Torres Vedras', 39.09, -9.26, 3, 13),
(4, 'LOJ004', 'Intermarché', 'Hyper', 'Braga', 41.54, -8.42, 4, 14),
(5, 'LOJ005', 'Intermarché', 'Super', 'Lisboa', 38.71, -9.14, 4, 15),
(6, 'LOJ006', 'Intermarché', 'Contact', 'Porto', 41.15, -8.61, 4, 16),
(7, 'LOJ007', 'Bricomarché', 'Grande', 'Coimbra', 40.21, -8.43, 5, 17),
(8, 'LOJ008', 'Intermarché', 'Super', 'Faro', 37.01, -7.93, 5, 18),
(9, 'LOJ009', 'Intermarché', 'Hyper', 'Setúbal', 38.52, -8.89, 6, 19),
(10, 'LOJ010', 'Intermarché', 'Super', 'Guarda', 40.54, -7.27, 6, 20);

-- Insert Checklists
INSERT INTO checklists (id, name, target_role, sections) VALUES
(1, 'Auditoria Qualidade 2025', 'DOT', 
'[
  {
    "id": 101,
    "name": "Frescura dos Alimentos",
    "orderindex": 1,
    "items": [
      {
        "id": 1001,
        "name": "Temperatura",
        "criteria": [
          {"id": 10001, "name": "Temperatura de vitrinas dentro do limite", "weight": 1},
          {"id": 10002, "name": "Registos de temperatura atualizados", "weight": 1}
        ]
      },
      {
        "id": 1002,
        "name": "Validades",
        "criteria": [
          {"id": 10003, "name": "Validades dentro de prazo", "weight": 2},
          {"id": 10004, "name": "Procedimento de quebras cumprido", "weight": 1}
        ]
      }
    ]
  },
  {
    "id": 102,
    "name": "Limpeza do Espaço",
    "orderindex": 2,
    "items": [
      {
        "id": 2001,
        "name": "Pavimento e Paredes",
        "criteria": [
          {"id": 20001, "name": "Limpeza geral do pavimento", "weight": 1},
          {"id": 20002, "name": "Estado das paredes e tetos", "weight": 1}
        ]
      }
    ]
  },
  {
    "id": 103,
    "name": "Exposição / Planograma",
    "orderindex": 3,
    "items": [
      {
        "id": 3001,
        "name": "Linear",
        "criteria": [
          {"id": 30001, "name": "Etiquetas de preço presentes", "weight": 1},
          {"id": 30002, "name": "Rupturas visuais", "weight": 1}
        ]
      }
    ]
  }
]'::jsonb),
(2, 'Visita Aderente - Avaliação Cruzada', 'ADERENTE', 
'[
  {
    "id": 201,
    "name": "Atendimento ao Cliente",
    "orderindex": 1,
    "items": [
      {
        "id": 2101,
        "name": "Qualidade do Atendimento",
        "criteria": [
          {"id": 21001, "name": "Colaboradores disponíveis e simpáticos", "weight": 1},
          {"id": 21002, "name": "Tempo de espera adequado nas caixas", "weight": 1},
          {"id": 21003, "name": "Respostas claras às dúvidas dos clientes", "weight": 1}
        ]
      },
      {
        "id": 2102,
        "name": "Serviço Personalizado",
        "criteria": [
          {"id": 21004, "name": "Secções assistidas bem atendidas (talho, charcutaria, peixaria)", "weight": 2},
          {"id": 21005, "name": "Colaboradores com conhecimento dos produtos", "weight": 1}
        ]
      }
    ]
  },
  {
    "id": 202,
    "name": "Apresentação da Loja",
    "orderindex": 2,
    "items": [
      {
        "id": 2201,
        "name": "Organização Geral",
        "criteria": [
          {"id": 22001, "name": "Corredores livres e organizados", "weight": 1},
          {"id": 22002, "name": "Sinalética clara e visível", "weight": 1},
          {"id": 22003, "name": "Promoções bem destacadas", "weight": 1}
        ]
      },
      {
        "id": 2202,
        "name": "Ambiente",
        "criteria": [
          {"id": 22004, "name": "Iluminação adequada", "weight": 1},
          {"id": 22005, "name": "Ambiente agradável (música, climatização)", "weight": 1}
        ]
      }
    ]
  },
  {
    "id": 203,
    "name": "Boas Práticas",
    "orderindex": 3,
    "items": [
      {
        "id": 2301,
        "name": "Práticas Diferenciadas",
        "criteria": [
          {"id": 23001, "name": "Identificação de boas práticas a replicar", "weight": 2},
          {"id": 23002, "name": "Inovações no ponto de venda", "weight": 1},
          {"id": 23003, "name": "Práticas sustentáveis visíveis", "weight": 1}
        ]
      }
    ]
  }
]'::jsonb);

-- Insert Sample Audits
INSERT INTO audits (id, store_id, dot_user_id, checklist_id, dtstart, status, created_by) VALUES
(1, 1, 3, 1, '2025-12-10 09:00:00', 'SCHEDULED', 2),
(2, 2, 3, 1, '2025-12-12 10:00:00', 'SCHEDULED', 2),
(3, 4, 4, 1, '2025-12-11 14:00:00', 'SCHEDULED', 2);

-- Insert Sample Visits
INSERT INTO visits (id, store_id, user_id, type, title, description, dtstart, status, created_by) VALUES
(1, 5, 4, 'FORMACAO', 'Formação Segurança Alimentar', 'Sessão de formação sobre boas práticas', '2025-12-15 09:00:00', 'SCHEDULED', 2),
(2, 7, 5, 'ACOMPANHAMENTO', 'Acompanhamento Pós-Auditoria', 'Verificação de implementação de ações', '2025-12-20 10:00:00', 'SCHEDULED', 2);

-- Reset sequences
SELECT setval('users_id_seq', 20, true);
SELECT setval('stores_id_seq', 10, true);
SELECT setval('checklists_id_seq', 2, true);
SELECT setval('audits_id_seq', 3, true);
SELECT setval('visits_id_seq', 2, true);
