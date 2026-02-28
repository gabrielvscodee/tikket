import { PrismaClient, UserRole, Prisma, TicketStatus, TicketPriority } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// Type aliases for better type inference
type Department = Awaited<ReturnType<typeof prisma.department.create>>
type User = Awaited<ReturnType<typeof prisma.user.create>>
type Ticket = Awaited<ReturnType<typeof prisma.ticket.create>>

// Nomes brasileiros para usuários
const nomesBrasileiros = [
  'Ana Silva', 'Carlos Santos', 'Maria Oliveira', 'João Pereira', 'Fernanda Costa',
  'Ricardo Almeida', 'Juliana Ferreira', 'Bruno Rodrigues', 'Patricia Souza', 'Marcos Lima',
  'Camila Martins', 'Lucas Gomes', 'Amanda Ribeiro', 'Felipe Araújo', 'Larissa Dias',
  'Gabriel Rocha', 'Beatriz Carvalho', 'Rafael Monteiro', 'Isabela Nunes', 'Thiago Barbosa',
  'Mariana Teixeira', 'Gustavo Mendes', 'Carolina Freitas', 'Diego Cardoso', 'Renata Moura',
  'André Castro', 'Vanessa Ramos', 'Rodrigo Duarte', 'Tatiana Moreira', 'Leandro Azevedo'
]

// Assuntos de tickets em português
const assuntosTI = [
  'Computador não liga',
  'Problema com senha',
  'Internet lenta',
  'Impressora não funciona',
  'Erro ao acessar sistema',
  'Email não está chegando',
  'Teclado quebrado',
  'Monitor com tela preta',
  'Software não abre',
  'Backup não realizado',
  'Vírus detectado',
  'WiFi desconectando',
  'Mouse não responde',
  'Sistema travando',
  'Instalação de software',
  'Atualização de sistema',
  'Problema com impressão',
  'Acesso negado a pasta',
  'VPN não conecta',
  'Problema com headset'
]

const assuntosRH = [
  'Solicitação de férias',
  'Alteração de dados cadastrais',
  'Segunda via de contracheque',
  'Consulta de benefícios',
  'Solicitação de atestado médico',
  'Dúvida sobre vale transporte',
  'Alteração de dependentes',
  'Consulta de saldo de férias',
  'Solicitação de treinamento',
  'Dúvida sobre plano de saúde',
  'Alteração de conta bancária',
  'Solicitação de certificado',
  'Consulta de ponto',
  'Dúvida sobre 13º salário',
  'Solicitação de vale refeição',
  'Alteração de endereço',
  'Consulta de FGTS',
  'Solicitação de declaração',
  'Dúvida sobre rescisão',
  'Solicitação de transferência'
]

const assuntosVendas = [
  'Cotação de produto',
  'Dúvida sobre preço',
  'Solicitação de desconto',
  'Consulta de estoque',
  'Problema com pedido',
  'Cancelamento de compra',
  'Troca de produto',
  'Dúvida sobre entrega',
  'Solicitação de orçamento',
  'Consulta de prazo',
  'Problema com nota fiscal',
  'Solicitação de boleto',
  'Dúvida sobre garantia',
  'Consulta de condições de pagamento',
  'Solicitação de catálogo',
  'Problema com faturamento',
  'Dúvida sobre frete',
  'Solicitação de visita técnica',
  'Consulta de disponibilidade',
  'Problema com devolução'
]

const assuntosFinanceiro = [
  'Consulta de fatura',
  'Solicitação de segunda via',
  'Dúvida sobre pagamento',
  'Problema com boleto',
  'Solicitação de estorno',
  'Consulta de saldo',
  'Dúvida sobre desconto',
  'Problema com cartão',
  'Solicitação de reembolso',
  'Consulta de extrato',
  'Dúvida sobre juros',
  'Problema com transferência',
  'Solicitação de comprovante',
  'Consulta de inadimplência',
  'Dúvida sobre parcelamento'
]

const assuntosSuporte = [
  'Dúvida sobre produto',
  'Problema com instalação',
  'Solicitação de manual',
  'Consulta de garantia',
  'Problema com funcionamento',
  'Dúvida sobre configuração',
  'Solicitação de treinamento',
  'Problema com atualização',
  'Consulta de compatibilidade',
  'Dúvida sobre manutenção'
]

// Descrições de tickets em português
const descricoesTI = [
  'Meu computador não está ligando. Quando aperto o botão de energia, nada acontece.',
  'Esqueci minha senha e não consigo acessar o sistema. Preciso de ajuda para redefini-la.',
  'A internet está muito lenta hoje. Não consigo trabalhar normalmente.',
  'A impressora não está imprimindo. Já tentei reiniciar mas não funcionou.',
  'Estou recebendo um erro ao tentar acessar o sistema. A mensagem diz "Acesso negado".',
  'Não estou recebendo emails. Já verifiquei a caixa de spam mas não há nada.',
  'Meu teclado parou de funcionar. Algumas teclas não respondem.',
  'O monitor está com a tela preta. O computador parece estar ligado mas não vejo nada.',
  'O software não está abrindo. Quando clico no ícone, nada acontece.',
  'O backup automático não foi realizado esta semana. Preciso verificar o que aconteceu.',
  'O antivírus detectou um vírus no meu computador. O que devo fazer?',
  'O WiFi está desconectando constantemente. É muito difícil trabalhar assim.',
  'Meu mouse não está respondendo. Já tentei trocar a porta USB mas não adiantou.',
  'O sistema está travando frequentemente. Preciso de ajuda urgente.',
  'Preciso instalar um novo software. Pode me ajudar com a instalação?',
  'Há uma atualização disponível para o sistema. Devo atualizar agora?',
  'Estou tendo problemas para imprimir documentos. A impressora não reconhece o comando.',
  'Não consigo acessar uma pasta compartilhada. Recebo mensagem de acesso negado.',
  'A VPN não está conectando. Preciso acessar os arquivos remotos.',
  'Meu headset não está funcionando. Não consigo ouvir nas reuniões.'
]

const descricoesRH = [
  'Gostaria de solicitar minhas férias para o próximo mês. Qual o procedimento?',
  'Preciso alterar meu endereço no sistema. Como faço isso?',
  'Perdi minha segunda via do contracheque. Como posso solicitar outra?',
  'Gostaria de consultar quais benefícios estou recebendo atualmente.',
  'Preciso enviar um atestado médico. Para onde devo enviar?',
  'Tenho dúvidas sobre o vale transporte. Como funciona o desconto?',
  'Preciso adicionar um dependente ao meu plano de saúde. Qual a documentação necessária?',
  'Gostaria de consultar quanto de saldo de férias eu tenho disponível.',
  'Gostaria de me inscrever no treinamento de liderança. Como faço?',
  'Tenho dúvidas sobre a cobertura do plano de saúde. O que está incluído?',
  'Preciso alterar a conta bancária para depósito do salário. Como proceder?',
  'Preciso de um certificado de vínculo empregatício. Como solicito?',
  'Gostaria de consultar meu ponto do mês passado. Onde posso ver?',
  'Tenho dúvidas sobre o cálculo do 13º salário. Como é feito?',
  'Gostaria de solicitar o vale refeição. Qual o valor e como funciona?',
  'Mudei de endereço e preciso atualizar no sistema. Onde faço isso?',
  'Gostaria de consultar informações sobre meu FGTS. Como acesso?',
  'Preciso de uma declaração de rendimentos. Como solicito?',
  'Tenho dúvidas sobre o processo de rescisão. Quais são meus direitos?',
  'Gostaria de solicitar transferência para outro setor. Qual o procedimento?'
]

const descricoesVendas = [
  'Gostaria de receber uma cotação para o produto X. Qual o melhor preço?',
  'Tenho dúvidas sobre o preço do produto Y. Há desconto para compra em quantidade?',
  'Gostaria de solicitar um desconto especial. Somos clientes há muitos anos.',
  'Preciso verificar se o produto Z está em estoque. Quando terá disponibilidade?',
  'Estou tendo problemas com meu pedido. Ainda não recebi a confirmação.',
  'Gostaria de cancelar minha compra. Qual o procedimento?',
  'Preciso trocar um produto que comprei. Está com defeito.',
  'Tenho dúvidas sobre o prazo de entrega. Quando chegará?',
  'Gostaria de solicitar um orçamento completo. Preciso para apresentar à diretoria.',
  'Preciso saber o prazo de entrega para o produto A. É urgente.',
  'Estou com problemas na nota fiscal. Os dados estão incorretos.',
  'Gostaria de solicitar um novo boleto. O anterior venceu.',
  'Tenho dúvidas sobre a garantia do produto. Quanto tempo cobre?',
  'Gostaria de consultar as condições de pagamento disponíveis.',
  'Preciso de um catálogo atualizado dos produtos. Pode enviar?',
  'Estou com problemas no faturamento. A nota fiscal não foi emitida.',
  'Tenho dúvidas sobre o valor do frete. Como é calculado?',
  'Gostaria de solicitar uma visita técnica. Preciso de suporte.',
  'Preciso verificar a disponibilidade do produto B. Quando terá estoque?',
  'Estou com problemas para devolver um produto. Qual o procedimento?'
]

// Função para gerar data aleatória nos últimos 6 meses
function getRandomDateInRange(monthsAgo: number, daysAgo: number = 0): Date {
  const now = new Date()
  const date = new Date(now.getFullYear(), now.getMonth() - monthsAgo, now.getDate() - daysAgo)
  const randomHour = Math.floor(Math.random() * 8) + 8 // Entre 8h e 16h
  const randomMinute = Math.floor(Math.random() * 60)
  date.setHours(randomHour, randomMinute, 0, 0)
  return date
}

// Função para gerar data de resolução baseada na criação
function getResolutionDate(createdAt: Date, status: TicketStatus): Date {
  if (status === 'OPEN' || status === 'IN_PROGRESS') {
    return createdAt
  }
  const hoursToResolve = Math.floor(Math.random() * 168) + 2 // 2 horas a 7 dias
  return new Date(createdAt.getTime() + hoursToResolve * 60 * 60 * 1000)
}

async function main() {
  const shouldClearData = process.env.CLEAR_DATA === 'true' || process.env.NODE_ENV !== 'production'
  
  if (shouldClearData) {
    console.log('🗑️  Limpando dados existentes...')
    
    // Deletar todos os dados em ordem (respeitando foreign keys)
    await prisma.ticketComment.deleteMany()
    await prisma.ticketAttachment.deleteMany()
    await prisma.ticket.deleteMany()
    await prisma.userSection.deleteMany()
    await prisma.section.deleteMany()
    await prisma.userDepartment.deleteMany()
    await prisma.department.deleteMany()
    await prisma.user.deleteMany()
    await prisma.tenant.deleteMany()
    
    console.log('✅ Dados limpos com sucesso!')
  }
  
  console.log('🌱 Iniciando seed do banco de dados...')

  // 1. Criar ou encontrar Tenant padrão
  let tenant = await prisma.tenant.findUnique({
    where: { slug: 'default' },
  })

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Empresa Padrão',
        slug: 'default',
      },
    })
    console.log('✅ Tenant criado:', tenant.slug)
  } else {
    console.log('✅ Tenant já existe:', tenant.slug)
  }

  // 2. Criar Departamentos
  const departamentos = [
    { id: 'ti-dept', name: 'Suporte Técnico', description: 'Suporte técnico e problemas de TI' },
    { id: 'rh-dept', name: 'Recursos Humanos', description: 'Solicitações e consultas de RH' },
    { id: 'vendas-dept', name: 'Vendas', description: 'Vendas e consultas de clientes' },
    { id: 'financeiro-dept', name: 'Financeiro', description: 'Questões financeiras e pagamentos' },
    { id: 'suporte-dept', name: 'Suporte ao Cliente', description: 'Suporte geral aos clientes' },
  ]

  const departmentsCreated: Department[] = []
  for (const dept of departamentos) {
    let department = await prisma.department.findUnique({
      where: { id: dept.id },
    })
    
    if (!department) {
      department = await prisma.department.create({
        data: {
          id: dept.id,
          name: dept.name,
          description: dept.description,
          tenantId: tenant.id,
        },
      })
      departmentsCreated.push(department)
    } else {
      departmentsCreated.push(department)
    }
  }

  console.log('✅ Departamentos verificados/criados:', departmentsCreated.length)

  // 3. Criar usuários
  const passwordHash = await bcrypt.hash('admin123', 10)
  const agentPasswordHash = await bcrypt.hash('agente123', 10)
  const userPasswordHash = await bcrypt.hash('usuario123', 10)
  const supervisorPasswordHash = await bcrypt.hash('supervisor123', 10)

  // Admin
  let admin = await prisma.user.findUnique({
    where: { email: 'admin@default.com' },
  })

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: 'admin@default.com',
        password: passwordHash,
        name: 'Administrador Sistema',
        role: UserRole.ADMIN,
        tenantId: tenant.id,
      },
    })
    console.log('✅ Admin criado:', admin.email)
  } else {
    // Ensure admin is in the correct tenant
    if (admin.tenantId !== tenant.id) {
      admin = await prisma.user.update({
        where: { id: admin.id },
        data: { tenantId: tenant.id },
      })
    }
    console.log('✅ Admin já existe:', admin.email)
  }

  const existingUsersCount = await prisma.user.count()
  const shouldCreateTestData = shouldClearData || existingUsersCount <= 1

  // Supervisores (1 por departamento)
  const supervisors: User[] = []
  if (shouldCreateTestData) {
    const supervisorEmails = [
      'supervisor.ti@empresa.com',
      'supervisor.rh@empresa.com',
      'supervisor.vendas@empresa.com',
      'supervisor.financeiro@empresa.com',
      'supervisor.suporte@empresa.com',
    ]

    for (let i = 0; i < supervisorEmails.length; i++) {
      const existingSupervisor = await prisma.user.findUnique({
        where: { email: supervisorEmails[i] },
      })
      
      if (!existingSupervisor) {
        const supervisor = await prisma.user.create({
          data: {
            email: supervisorEmails[i],
            password: supervisorPasswordHash,
            name: `Supervisor ${departamentos[i].name}`,
            role: UserRole.SUPERVISOR,
            tenantId: tenant.id,
          },
        })
        supervisors.push(supervisor)
      } else {
        supervisors.push(existingSupervisor)
      }
    }
    console.log('✅ Supervisores verificados/criados:', supervisors.length)
  } else {
    console.log('⏭️  Pulando criação de dados de teste (dados já existem)')
  }

  // Agentes (3-4 por departamento)
  const agents: Array<{ agent: User; departmentId: string }> = []
  if (shouldCreateTestData) {
    let agentIndex = 0
    for (let deptIndex = 0; deptIndex < departmentsCreated.length; deptIndex++) {
      const agentsPerDept = deptIndex === 0 ? 4 : 3 // TI tem 4 agentes, outros têm 3
      for (let j = 0; j < agentsPerDept; j++) {
        const agentEmail = `agente${agentIndex + 1}.${departamentos[deptIndex].name.toLowerCase().replace(' ', '')}@empresa.com`
        const existingAgent = await prisma.user.findUnique({
          where: { email: agentEmail },
        })
        
        if (!existingAgent) {
          const agent = await prisma.user.create({
            data: {
              email: agentEmail,
              password: agentPasswordHash,
              name: nomesBrasileiros[agentIndex % nomesBrasileiros.length],
              role: UserRole.AGENT,
              tenantId: tenant.id,
            },
          })
          agents.push({ agent, departmentId: departmentsCreated[deptIndex].id })
        } else {
          agents.push({ agent: existingAgent, departmentId: departmentsCreated[deptIndex].id })
        }
        agentIndex++
      }
    }
    console.log('✅ Agentes verificados/criados:', agents.length)
  }

  // Usuários regulares (20 usuários)
  const users: User[] = []
  if (shouldCreateTestData) {
    for (let i = 0; i < 20; i++) {
      const userEmail = `usuario${i + 1}@empresa.com`
      const existingUser = await prisma.user.findUnique({
        where: { email: userEmail },
      })
      
      if (!existingUser) {
        const user = await prisma.user.create({
          data: {
            email: userEmail,
            password: userPasswordHash,
            name: nomesBrasileiros[i % nomesBrasileiros.length],
            role: UserRole.USER,
            tenantId: tenant.id,
          },
        })
        users.push(user)
      } else {
        users.push(existingUser)
      }
    }
    console.log('✅ Usuários verificados/criados:', users.length)
  }

  // 4. Atribuir agentes e supervisores aos departamentos (apenas se dados de teste foram criados)
  if (shouldCreateTestData && supervisors.length > 0 && agents.length > 0) {
    let agentCounter = 0
    for (let deptIndex = 0; deptIndex < departmentsCreated.length; deptIndex++) {
      const dept = departmentsCreated[deptIndex]
      
      // Atribuir supervisor
      const existingSupervisorDept = await prisma.userDepartment.findFirst({
        where: {
          userId: supervisors[deptIndex].id,
          departmentId: dept.id,
        },
      })
      
      if (!existingSupervisorDept) {
        await prisma.userDepartment.create({
          data: {
            userId: supervisors[deptIndex].id,
            departmentId: dept.id,
          },
        })
      }

      // Atribuir agentes
      const agentsPerDept = deptIndex === 0 ? 4 : 3
      for (let j = 0; j < agentsPerDept && agentCounter < agents.length; j++) {
        const existingAgentDept = await prisma.userDepartment.findFirst({
          where: {
            userId: agents[agentCounter].agent.id,
            departmentId: dept.id,
          },
        })
        
        if (!existingAgentDept) {
          await prisma.userDepartment.create({
            data: {
              userId: agents[agentCounter].agent.id,
              departmentId: dept.id,
            },
          })
        }
        agentCounter++
      }
    }

    // Admin em todos os departamentos
    for (const dept of departmentsCreated) {
      const existingAdminDept = await prisma.userDepartment.findFirst({
        where: {
          userId: admin.id,
          departmentId: dept.id,
        },
      })
      
      if (!existingAdminDept) {
        await prisma.userDepartment.create({
          data: {
            userId: admin.id,
            departmentId: dept.id,
          },
        })
      }
    }

    console.log('✅ Agentes e supervisores atribuídos aos departamentos')
  }

  // 5. Criar tickets com dados variados para analytics (apenas se dados de teste foram criados)
  const ticketsCreated: Ticket[] = []
  
  if (shouldCreateTestData && users.length > 0) {
    const statuses: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'WAITING_REQUESTER', 'WAITING_AGENT', 'ON_HOLD', 'RESOLVED', 'CLOSED']
    const priorities: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
  
  // Distribuir tickets pelos últimos 6 meses
  for (let month = 0; month < 6; month++) {
    const ticketsPerMonth = month === 0 ? 80 : month === 1 ? 70 : month === 2 ? 60 : 50 // Mais tickets recentes
    
    for (let i = 0; i < ticketsPerMonth; i++) {
      const deptIndex = Math.floor(Math.random() * departmentsCreated.length)
      const department = departmentsCreated[deptIndex]
      
      // Selecionar assunto e descrição baseado no departamento
      let assunto = ''
      let descricao = ''
      
      if (department.id === 'ti-dept') {
        assunto = assuntosTI[Math.floor(Math.random() * assuntosTI.length)]
        descricao = descricoesTI[Math.floor(Math.random() * descricoesTI.length)]
      } else if (department.id === 'rh-dept') {
        assunto = assuntosRH[Math.floor(Math.random() * assuntosRH.length)]
        descricao = descricoesRH[Math.floor(Math.random() * descricoesRH.length)]
      } else if (department.id === 'vendas-dept') {
        assunto = assuntosVendas[Math.floor(Math.random() * assuntosVendas.length)]
        descricao = descricoesVendas[Math.floor(Math.random() * descricoesVendas.length)]
      } else if (department.id === 'financeiro-dept') {
        assunto = assuntosFinanceiro[Math.floor(Math.random() * assuntosFinanceiro.length)]
        descricao = `Tenho uma questão sobre: ${assunto.toLowerCase()}. Preciso de ajuda urgente.`
      } else {
        assunto = assuntosSuporte[Math.floor(Math.random() * assuntosSuporte.length)]
        descricao = `Preciso de suporte sobre: ${assunto.toLowerCase()}. Aguardo retorno.`
      }
      
      const requester = users[Math.floor(Math.random() * users.length)]
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const priority = priorities[Math.floor(Math.random() * priorities.length)]
      
      // Selecionar agente do departamento
      const deptAgents = agents.filter(a => a.departmentId === department.id)
      const assignee = status !== 'OPEN' && deptAgents.length > 0
        ? deptAgents[Math.floor(Math.random() * deptAgents.length)].agent
        : null
      
      const createdAt = getRandomDateInRange(month, Math.floor(Math.random() * 30))
      const updatedAt = getResolutionDate(createdAt, status)
      
      const ticket = await prisma.ticket.create({
        data: {
          subject: assunto,
          description: descricao,
          priority: priority,
          status: status,
          tenantId: tenant.id,
          requesterId: requester.id,
          assigneeId: assignee?.id || null,
          departmentId: department.id,
          createdAt: createdAt,
          updatedAt: updatedAt,
        },
      })
      
      ticketsCreated.push(ticket)
    }
  }

  // Adicionar alguns tickets abertos recentes para o dashboard
  for (let i = 0; i < 15; i++) {
    const deptIndex = Math.floor(Math.random() * departmentsCreated.length)
    const department = departmentsCreated[deptIndex]
    
    let assunto = ''
    let descricao = ''
    
    if (department.id === 'ti-dept') {
      assunto = assuntosTI[Math.floor(Math.random() * assuntosTI.length)]
      descricao = descricoesTI[Math.floor(Math.random() * descricoesTI.length)]
    } else if (department.id === 'rh-dept') {
      assunto = assuntosRH[Math.floor(Math.random() * assuntosRH.length)]
      descricao = descricoesRH[Math.floor(Math.random() * descricoesRH.length)]
    } else if (department.id === 'vendas-dept') {
      assunto = assuntosVendas[Math.floor(Math.random() * assuntosVendas.length)]
      descricao = descricoesVendas[Math.floor(Math.random() * descricoesVendas.length)]
    } else if (department.id === 'financeiro-dept') {
      assunto = assuntosFinanceiro[Math.floor(Math.random() * assuntosFinanceiro.length)]
      descricao = `Tenho uma questão sobre: ${assunto.toLowerCase()}. Preciso de ajuda urgente.`
    } else {
      assunto = assuntosSuporte[Math.floor(Math.random() * assuntosSuporte.length)]
      descricao = `Preciso de suporte sobre: ${assunto.toLowerCase()}. Aguardo retorno.`
    }
    
    const requester = users[Math.floor(Math.random() * users.length)]
    const status: TicketStatus = i < 5 ? 'OPEN' : i < 10 ? 'IN_PROGRESS' : 'WAITING_REQUESTER'
    const priority = priorities[Math.floor(Math.random() * priorities.length)]
    
    const deptAgents = agents.filter(a => a.departmentId === department.id)
    const assignee = status === 'IN_PROGRESS' && deptAgents.length > 0
      ? deptAgents[Math.floor(Math.random() * deptAgents.length)].agent
      : null
    
    await prisma.ticket.create({
      data: {
        subject: assunto,
        description: descricao,
        priority: priority,
        status: status,
        tenantId: tenant.id,
        requesterId: requester.id,
        assigneeId: assignee?.id || null,
        departmentId: department.id,
      },
    })
  }

    console.log('✅ Tickets criados:', ticketsCreated.length + 15)
  }

  // 6. Criar alguns comentários em tickets resolvidos/fechados (apenas se dados de teste foram criados)
  if (shouldCreateTestData && ticketsCreated.length > 0) {
  const resolvedTickets = ticketsCreated.filter(t => 
    t.status === 'RESOLVED' || t.status === 'CLOSED'
  ).slice(0, 100) // Adicionar comentários em até 100 tickets

  for (const ticket of resolvedTickets) {
    const ticketWithAssignee = await prisma.ticket.findUnique({
      where: { id: ticket.id },
      include: { assignee: true },
    })

    if (ticketWithAssignee?.assignee) {
      // Comentário do agente
      await prisma.ticketComment.create({
        data: {
          content: 'Problema identificado e resolvido. Aguardo confirmação do solicitante.',
          isInternal: false,
          ticketId: ticket.id,
          authorId: ticketWithAssignee.assignee.id,
          tenantId: tenant.id,
          createdAt: new Date(ticket.createdAt.getTime() + 2 * 60 * 60 * 1000), // 2h depois
        },
      })

      // Comentário do solicitante (em alguns casos)
      if (Math.random() > 0.5) {
        await prisma.ticketComment.create({
          data: {
            content: 'Problema resolvido! Obrigado pelo suporte.',
            isInternal: false,
            ticketId: ticket.id,
            authorId: ticketWithAssignee.requesterId,
            tenantId: tenant.id,
            createdAt: new Date(ticket.updatedAt.getTime() - 1 * 60 * 60 * 1000), // 1h antes da resolução
          },
        })
      }
    }
    console.log('✅ Comentários criados')
  }

  console.log('\n📊 Resumo do Seed:')
  console.log(`   - Tenant: ${tenant.name}`)
  console.log(`   - Departamentos: ${departmentsCreated.length}`)
  if (shouldCreateTestData) {
    console.log(`   - Usuários: 1 Admin, ${supervisors.length} Supervisores, ${agents.length} Agentes, ${users.length} Usuários`)
    console.log(`   - Tickets: ${ticketsCreated.length} total`)
    console.log(`   - Comentários: ~${ticketsCreated.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length} comentários`)
  } else {
    console.log(`   - Usuários: 1 Admin (dados de teste não criados - já existem dados no banco)`)
  }
  console.log('\n✅ Banco de dados semeado com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
