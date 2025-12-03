# OnTrack - Credenciais de Acesso

## 📱 Acesso via Tunnel
URL: https://handhelds-problems-spell-bearing.trycloudflare.com

## 👥 Utilizadores de Teste

### Admin
- **Email:** `admin@mousquetaires.com`
- **Password:** `admin`
- **Perfil:** Administrador do sistema

### Amont
- **Email:** `amont@mousquetaires.com`
- **Password:** `amont`
- **Perfil:** Supervisão e análise de todas as visitas

### DOT (Delegados Técnicos Operacionais)
| Email | Password | Lojas Atribuídas |
|-------|----------|------------------|
| `dot1@mousquetaires.com` | `dot1` | LOJ001, LOJ002, LOJ003 |
| `dot2@mousquetaires.com` | `dot2` | LOJ004, LOJ005, LOJ006 |
| `dot3@mousquetaires.com` | `dot3` | LOJ007, LOJ008 |
| `dot4@mousquetaires.com` | `dot4` | LOJ009, LOJ010 |

### Aderentes (Proprietários de Lojas)
| Email | Password | Loja |
|-------|----------|------|
| `aderente1@intermarche.pt` | `aderente1` | LOJ001 - Odivelas |
| `aderente2@intermarche.pt` | `aderente2` | LOJ002 - Alfragide |
| `aderente3@intermarche.pt` | `aderente3` | LOJ003 - Torres Vedras |
| `aderente4@intermarche.pt` | `aderente4` | LOJ004 - Braga |
| `aderente5@intermarche.pt` | `aderente5` | LOJ005 - Lisboa |
| `aderente6@intermarche.pt` | `aderente6` | LOJ006 - Porto |
| `aderente7@intermarche.pt` | `aderente7` | LOJ007 - Coimbra |
| `aderente8@intermarche.pt` | `aderente8` | LOJ008 - Faro |
| `aderente9@intermarche.pt` | `aderente9` | LOJ009 - Setúbal |
| `aderente10@intermarche.pt` | `aderente10` | LOJ010 - Guarda |

## 🔐 Notas de Segurança
- Todas as passwords estão em hash bcrypt na base de dados
- Para produção, alterar as passwords e usar segredos fortes
- O JWT_SECRET deve ser alterado em produção (.env)

## 🌐 Endpoints da API
- Frontend: `https://handhelds-problems-spell-bearing.trycloudflare.com`
- API: `https://handhelds-problems-spell-bearing.trycloudflare.com/api`
- Health check: `https://handhelds-problems-spell-bearing.trycloudflare.com/api/health`

## 🐳 Docker
- App container: `ontrack-app` (porta 3001)
- DB container: `ontrack-postgres` (porta 5432)
