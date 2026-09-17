import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { AuditLogModal } from './components/AuditLogModal'
import { BookingForm } from './components/BookingForm'
import { BookingItemsModal } from './components/BookingItemsModal'
import { BookingList } from './components/BookingList'
import { CloseTableModal } from './components/CloseTableModal'
import { EditBookingModal, type BookingEditPatch } from './components/EditBookingModal'
import { Login } from './components/Login'
import { MenuModal } from './components/MenuModal'
import { MonthCalendar } from './components/MonthCalendar'
import { PricingModal } from './components/PricingModal'
import { RevenueDashboard } from './components/RevenueDashboard'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { displayNameFromEmail, formatDateDisplay } from './lib/format'
import { totalPessoas } from './lib/schedule'
import { uploadComprovante } from './lib/storage'
import { supabase } from './lib/supabase'
import type {
  AuditLogEntry,
  Booking,
  BookingInput,
  BookingItem,
  BookingPayment,
  FormaPagamento,
  MenuItem,
  PricingSettings,
  Role,
} from './types'

type Tab = 'agendamentos' | 'faturamento'

const DEFAULT_PRICING: PricingSettings = {
  id: 1,
  valor_adulto: 90,
  valor_crianca: 45,
  updated_at: new Date().toISOString(),
}

function Dashboard() {
  const { session, signOut } = useAuth()
  const [tab, setTab] = useState<Tab>('agendamentos')
  const [role, setRole] = useState<Role>('colaborador')
  const isAdmin = role === 'administrador'
  const [bookings, setBookings] = useState<Booking[]>([])
  const [items, setItems] = useState<BookingItem[]>([])
  const [payments, setPayments] = useState<BookingPayment[]>([])
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showExtraForm, setShowExtraForm] = useState(false)
  const [showPricing, setShowPricing] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showAuditLog, setShowAuditLog] = useState(false)
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [itemsBooking, setItemsBooking] = useState<Booking | null>(null)
  const [closeTableBooking, setCloseTableBooking] = useState<Booking | null>(null)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [sortAlpha, setSortAlpha] = useState(true)
  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  async function loadAll() {
    setLoading(true)
    const [bookingsRes, itemsRes, paymentsRes, pricingRes, menuRes, profileRes] = await Promise.all([
      supabase.from('bookings').select('*').order('data_agendamento', { ascending: true }),
      supabase.from('booking_items').select('*'),
      supabase.from('booking_payments').select('*').order('created_at', { ascending: true }),
      supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
      supabase.from('menu_items').select('*').order('nome', { ascending: true }),
      session ? supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle() : Promise.resolve(null),
    ])
    if (bookingsRes.error) setError(bookingsRes.error.message)
    else setBookings(bookingsRes.data as Booking[])

    if (!itemsRes.error) setItems(itemsRes.data as BookingItem[])
    if (!paymentsRes.error) setPayments(paymentsRes.data as BookingPayment[])
    if (!pricingRes.error && pricingRes.data) setPricing(pricingRes.data as PricingSettings)
    if (!menuRes.error) setMenuItems(menuRes.data as MenuItem[])
    if (profileRes && !profileRes.error && profileRes.data) setRole(profileRes.data.role as Role)

    if (!bookingsRes.error) setError(null)
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    if (!isAdmin && tab === 'faturamento') setTab('agendamentos')
  }, [isAdmin, tab])

  useEffect(() => {
    setCloseTableBooking((current) => (current ? (bookings.find((b) => b.id === current.id) ?? null) : null))
    setItemsBooking((current) => (current ? (bookings.find((b) => b.id === current.id) ?? null) : null))
    setEditingBooking((current) => (current ? (bookings.find((b) => b.id === current.id) ?? null) : null))
  }, [bookings])

  const itemsTotalByBooking = useMemo(() => {
    const map: Record<string, number> = {}
    for (const item of items) {
      map[item.booking_id] = (map[item.booking_id] ?? 0) + item.quantidade * item.valor_unitario
    }
    return map
  }, [items])

  async function recomputeValorPago(bookingId: string) {
    const { data, error } = await supabase.from('booking_payments').select('valor').eq('booking_id', bookingId)
    if (error) throw new Error(error.message)
    const total = (data ?? []).reduce((sum, p) => sum + Number(p.valor), 0)
    const { error: updateError } = await supabase.from('bookings').update({ valor_pago: total }).eq('id', bookingId)
    if (updateError) throw new Error(updateError.message)
  }

  async function handleCreate(
    input: BookingInput,
    entradaForma: FormaPagamento | null,
    entradaPagante: string | null,
    comprovante: File | null,
  ) {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        ...input,
        created_by: session?.user.id,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)

    if (entradaForma && input.valor_pago > 0) {
      const { data: payment, error: paymentError } = await supabase
        .from('booking_payments')
        .insert({
          booking_id: data.id,
          forma_pagamento: entradaForma,
          valor: input.valor_pago,
          pagante: entradaPagante,
        })
        .select()
        .single()
      if (paymentError) throw new Error(paymentError.message)

      if (comprovante && payment) {
        const url = await uploadComprovante(comprovante, payment.id)
        await supabase.from('booking_payments').update({ comprovante_url: url }).eq('id', payment.id)
      }
    }
    await loadAll()
  }

  async function handleAddPayments(
    booking: Booking,
    entries: { forma_pagamento: FormaPagamento; valor: number; pagante: string | null; comprovante: File | null }[],
  ) {
    const { data: inserted, error: insertError } = await supabase
      .from('booking_payments')
      .insert(
        entries.map((e) => ({
          booking_id: booking.id,
          forma_pagamento: e.forma_pagamento,
          valor: e.valor,
          pagante: e.pagante,
        })),
      )
      .select()
    if (insertError) throw new Error(insertError.message)

    for (let i = 0; i < entries.length; i++) {
      const comprovante = entries[i].comprovante
      const paymentRow = inserted?.[i]
      if (comprovante && paymentRow) {
        const url = await uploadComprovante(comprovante, paymentRow.id)
        await supabase.from('booking_payments').update({ comprovante_url: url }).eq('id', paymentRow.id)
      }
    }

    await recomputeValorPago(booking.id)
    await loadAll()
  }

  async function handleEditPayment(
    payment: BookingPayment,
    patch: { forma_pagamento: FormaPagamento; valor: number; pagante: string | null },
  ) {
    const { error } = await supabase
      .from('booking_payments')
      .update({ forma_pagamento: patch.forma_pagamento, valor: patch.valor, pagante: patch.pagante })
      .eq('id', payment.id)
    if (error) throw new Error(error.message)

    await recomputeValorPago(payment.booking_id)
    await loadAll()
  }

  async function handleDeletePayment(payment: BookingPayment) {
    const { error } = await supabase.from('booking_payments').delete().eq('id', payment.id)
    if (error) {
      setError(error.message)
      return
    }
    await recomputeValorPago(payment.booking_id)
    await loadAll()
  }

  async function handleAttachComprovante(payment: BookingPayment, file: File) {
    const url = await uploadComprovante(file, payment.id)
    const { error } = await supabase.from('booking_payments').update({ comprovante_url: url }).eq('id', payment.id)
    if (error) {
      setError(error.message)
      return
    }
    await loadAll()
  }

  async function handleUpdateNoShow(booking: Booking, adultos: number, criancas: number) {
    const { error } = await supabase
      .from('bookings')
      .update({ qtd_adultos_nao_compareceram: adultos, qtd_criancas_nao_compareceram: criancas })
      .eq('id', booking.id)
    if (error) {
      setError(error.message)
      return
    }
    await loadAll()
  }

  async function handleEditBooking(bookingId: string, patch: BookingEditPatch) {
    const original = bookings.find((b) => b.id === bookingId)
    const { valor_pago, ...bookingFields } = patch

    const { error } = await supabase.from('bookings').update(bookingFields).eq('id', bookingId)
    if (error) throw new Error(error.message)

    const delta = original ? Math.round((valor_pago - original.valor_pago) * 100) / 100 : 0
    if (delta !== 0) {
      const { error: paymentError } = await supabase.from('booking_payments').insert({
        booking_id: bookingId,
        forma_pagamento: 'dinheiro',
        valor: delta,
        pagante: 'Ajuste (edição do agendamento)',
      })
      if (paymentError) throw new Error(paymentError.message)
      await recomputeValorPago(bookingId)
    }

    await loadAll()
  }

  async function handleDelete(booking: Booking) {
    const { error } = await supabase.from('bookings').delete().eq('id', booking.id)
    if (error) {
      setError(error.message)
      return
    }
    await loadAll()
  }

  async function handleSavePricing(valorAdulto: number, valorCrianca: number) {
    const { error } = await supabase
      .from('settings')
      .upsert({ id: 1, valor_adulto: valorAdulto, valor_crianca: valorCrianca })
    if (error) throw new Error(error.message)
    await loadAll()
  }

  async function handleAddItem(descricao: string, quantidade: number, valorUnitario: number) {
    if (!itemsBooking) return
    const { error } = await supabase.from('booking_items').insert({
      booking_id: itemsBooking.id,
      descricao,
      quantidade,
      valor_unitario: valorUnitario,
    })
    if (error) throw new Error(error.message)
    await loadAll()
  }

  async function handleDeleteItem(item: BookingItem) {
    const { error } = await supabase.from('booking_items').delete().eq('id', item.id)
    if (error) {
      setError(error.message)
      return
    }
    await loadAll()
  }

  async function handleAddMenuItem(nome: string, valor: number) {
    const { error } = await supabase.from('menu_items').insert({ nome, valor })
    if (error) throw new Error(error.message)
    await loadAll()
  }

  async function handleEditMenuItem(item: MenuItem, nome: string, valor: number) {
    const { error } = await supabase.from('menu_items').update({ nome, valor }).eq('id', item.id)
    if (error) throw new Error(error.message)
    await loadAll()
  }

  async function handleOpenAuditLog() {
    setShowAuditLog(true)
    setAuditLoading(true)
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (!error) setAuditLog(data as AuditLogEntry[])
    else setError(error.message)
    setAuditLoading(false)
  }

  async function handleDeleteMenuItem(item: MenuItem) {
    const { error } = await supabase.from('menu_items').delete().eq('id', item.id)
    if (error) {
      setError(error.message)
      return
    }
    await loadAll()
  }

  const filtered = useMemo(() => {
    const result = bookings.filter((b) => {
      const matchesSearch =
        !search || b.nome.toLowerCase().includes(search.toLowerCase()) || b.telefone.includes(search)
      const matchesDate = !dateFilter || b.data_agendamento === dateFilter
      return matchesSearch && matchesDate
    })
    if (sortAlpha) {
      result.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    }
    return result
  }, [bookings, search, dateFilter, sortAlpha])

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-sun-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <img src="/florada-logo.jpg" alt="Florada Café" className="h-10 w-10 rounded-full object-cover" />
            <h1 className="font-script text-2xl text-earth-900">Florada Café</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-earth-500">
            <span className="hidden sm:inline">
              {session?.user.email && displayNameFromEmail(session.user.email)} ·{' '}
              {isAdmin ? 'Administrador' : 'Colaborador'}
            </span>
            <button onClick={signOut} className="rounded-lg px-3 py-1.5 text-earth-600 hover:bg-earth-100">
              Sair
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-1 px-4">
          <TabButton active={tab === 'agendamentos'} onClick={() => setTab('agendamentos')}>
            Agendamentos
          </TabButton>
          {isAdmin && (
            <TabButton active={tab === 'faturamento'} onClick={() => setTab('faturamento')}>
              Faturamento
            </TabButton>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="py-10 text-center text-sm text-earth-500">Carregando...</p>
        ) : tab === 'agendamentos' ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <input
                placeholder="Buscar por nome ou telefone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm focus:border-sun-500 focus:outline-none"
              />
              {isAdmin && (
                <button
                  onClick={() => setShowPricing(true)}
                  className="rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm text-earth-600 hover:bg-earth-50"
                >
                  Preços
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => setShowMenu(true)}
                  className="rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm text-earth-600 hover:bg-earth-50"
                >
                  Cardápio
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={handleOpenAuditLog}
                  className="rounded-lg border border-earth-200 bg-white px-3 py-2 text-sm text-earth-600 hover:bg-earth-50"
                >
                  Atividade
                </button>
              )}
              <button
                onClick={() => setShowExtraForm(true)}
                className="ml-auto rounded-lg border border-field-600 px-4 py-2 text-sm font-medium text-field-700 hover:bg-field-50"
              >
                + Extra
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="rounded-lg bg-sun-500 px-4 py-2 text-sm font-medium text-white hover:bg-sun-600"
              >
                + Novo agendamento
              </button>
            </div>

            <div className="mb-6">
              <MonthCalendar
                monthDate={monthDate}
                bookings={bookings}
                selectedDate={dateFilter || null}
                onSelectDate={(date) => setDateFilter(date ?? '')}
                onMonthChange={setMonthDate}
              />
            </div>

            {dateFilter ? (
              <div className="flex flex-col gap-6">
                <h2 className="font-script text-xl text-earth-900">{formatDateDisplay(dateFilter)}</h2>
                <PeriodSection
                  label="Manhã"
                  bookings={filtered.filter((b) => b.periodo === 'manha')}
                  itemsTotalByBooking={itemsTotalByBooking}
                  pricing={pricing}
                  onCloseTable={setCloseTableBooking}
                  onEdit={setEditingBooking}
                  onDelete={handleDelete}
                  onManageItems={setItemsBooking}
                  sortAlpha={sortAlpha}
                  onToggleSort={() => setSortAlpha((v) => !v)}
                />
                <PeriodSection
                  label="Tarde"
                  bookings={filtered.filter((b) => b.periodo === 'tarde')}
                  itemsTotalByBooking={itemsTotalByBooking}
                  pricing={pricing}
                  onCloseTable={setCloseTableBooking}
                  onEdit={setEditingBooking}
                  onDelete={handleDelete}
                  onManageItems={setItemsBooking}
                  sortAlpha={sortAlpha}
                  onToggleSort={() => setSortAlpha((v) => !v)}
                />
              </div>
            ) : search ? (
              <BookingList
                bookings={filtered}
                itemsTotalByBooking={itemsTotalByBooking}
                pricing={pricing}
                onCloseTable={setCloseTableBooking}
                onEdit={setEditingBooking}
                onDelete={handleDelete}
                onManageItems={setItemsBooking}
                sortAlpha={sortAlpha}
                onToggleSort={() => setSortAlpha((v) => !v)}
              />
            ) : (
              <p className="py-10 text-center text-sm text-earth-500">
                Selecione um dia no calendário acima para ver os agendamentos, ou busque por nome/telefone.
              </p>
            )}
          </>
        ) : (
          <RevenueDashboard bookings={bookings} items={items} pricing={pricing} />
        )}
      </main>

      {showForm && (
        <BookingForm
          pricing={pricing}
          bookings={bookings}
          initialDate={dateFilter || null}
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
        />
      )}
      {showExtraForm && (
        <BookingForm
          pricing={pricing}
          bookings={bookings}
          variant="extra"
          initialDate={dateFilter || null}
          onSubmit={handleCreate}
          onClose={() => setShowExtraForm(false)}
        />
      )}
      {showPricing && (
        <PricingModal pricing={pricing} onSave={handleSavePricing} onClose={() => setShowPricing(false)} />
      )}
      {showAuditLog && (
        <AuditLogModal entries={auditLog} loading={auditLoading} onClose={() => setShowAuditLog(false)} />
      )}
      {showMenu && (
        <MenuModal
          menuItems={menuItems}
          onAdd={handleAddMenuItem}
          onEdit={handleEditMenuItem}
          onDelete={handleDeleteMenuItem}
          onClose={() => setShowMenu(false)}
        />
      )}
      {itemsBooking && (
        <BookingItemsModal
          booking={itemsBooking}
          items={items.filter((i) => i.booking_id === itemsBooking.id)}
          menuItems={menuItems}
          onAdd={handleAddItem}
          onDelete={handleDeleteItem}
          onClose={() => setItemsBooking(null)}
        />
      )}
      {closeTableBooking && (
        <CloseTableModal
          booking={closeTableBooking}
          pricing={pricing}
          itemsTotal={itemsTotalByBooking[closeTableBooking.id] ?? 0}
          payments={payments.filter((p) => p.booking_id === closeTableBooking.id)}
          onAddPayments={(entries) => handleAddPayments(closeTableBooking, entries)}
          onEditPayment={handleEditPayment}
          onDeletePayment={handleDeletePayment}
          onAttachComprovante={handleAttachComprovante}
          onUpdateNoShow={handleUpdateNoShow}
          onClose={() => setCloseTableBooking(null)}
        />
      )}
      {editingBooking && (
        <EditBookingModal
          booking={editingBooking}
          pricing={pricing}
          onSave={handleEditBooking}
          onClose={() => setEditingBooking(null)}
        />
      )}
    </div>
  )
}

function PeriodSection({
  label,
  bookings,
  itemsTotalByBooking,
  pricing,
  onCloseTable,
  onEdit,
  onDelete,
  onManageItems,
  sortAlpha,
  onToggleSort,
}: {
  label: string
  bookings: Booking[]
  itemsTotalByBooking: Record<string, number>
  pricing: PricingSettings
  onCloseTable: (booking: Booking) => void
  onEdit: (booking: Booking) => void
  onDelete: (booking: Booking) => Promise<void>
  onManageItems: (booking: Booking) => void
  sortAlpha?: boolean
  onToggleSort?: () => void
}) {
  const totalPessoasPeriodo = bookings.reduce((sum, b) => sum + totalPessoas(b), 0)
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-earth-600">{label}</h3>
        <span className="rounded-full bg-earth-100 px-2 py-0.5 text-xs text-earth-600">
          {totalPessoasPeriodo} pessoa(s) · {bookings.length} reserva(s)
        </span>
      </div>
      <BookingList
        bookings={bookings}
        itemsTotalByBooking={itemsTotalByBooking}
        pricing={pricing}
        onCloseTable={onCloseTable}
        onEdit={onEdit}
        onDelete={onDelete}
        onManageItems={onManageItems}
        showDateColumns={false}
        sortAlpha={sortAlpha}
        onToggleSort={onToggleSort}
      />
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 px-3 py-2 text-sm font-medium transition ${
        active ? 'border-sun-500 text-earth-900' : 'border-transparent text-earth-400 hover:text-earth-600'
      }`}
    >
      {children}
    </button>
  )
}

function Root() {
  const { session, loading } = useAuth()
  if (loading) return null
  return session ? <Dashboard /> : <Login />
}

function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  )
}

export default App
