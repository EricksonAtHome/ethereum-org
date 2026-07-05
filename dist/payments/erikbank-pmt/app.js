(function () {
  const PAYMENT = {
    payeeName: 'Sanne de Vries',
    amountCents: 4999,
    currency: 'EUR',
    method: 'erikbank'
  };

  const BANK_COLORS = {
    ERIKBANK: '#e8672c',
    DANSKE: '#14140f',
    NORDEA: '#4a90d9',
    SEB: '#7a8f4a',
    ING: '#e8672c',
    RABO: '#14140f',
    ABN: '#4a90d9',
    BUNQ: '#7a8f4a',
    BNP: '#e8672c',
    DEUTSCHE: '#14140f',
    SOCIETE: '#4a90d9',
    BBVA: '#7a8f4a'
  };

  let apiBase = window.ERIKBANK_API || 'http://localhost:8082';
  let selectedBankCode = 'ERIKBANK';
  let lastPayment = null;

  const statusEl = document.getElementById('payment-status');
  const bankListEl = document.getElementById('bank-list');
  const payBtn = document.getElementById('pay-btn');
  const qrTextEl = document.getElementById('qr-text');

  function setStatus(message, type) {
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = 'status-banner ' + (type || '');
    statusEl.hidden = !message;
  }

  function bankInitials(name) {
    return name.split(' ').map(function (part) { return part[0]; }).join('').slice(0, 2).toUpperCase();
  }

  function formatAmount(cents) {
    var euros = (cents / 100).toFixed(2).replace('.', ',');
    var parts = euros.split(',');
    return { whole: parts[0], fraction: parts[1] };
  }

  function renderBanks(banks) {
    if (!bankListEl) return;
    bankListEl.innerHTML = '';
    banks.forEach(function (bank, index) {
      var row = document.createElement('div');
      row.className = 'bank-row' + (index === 0 ? ' selected' : '');
      row.dataset.code = bank.code;
      var color = BANK_COLORS[bank.code] || '#14140f';
      row.innerHTML =
        '<div class="bank-icon" style="background:' + color + ';">' + bankInitials(bank.name) + '</div>' +
        '<span>' + bank.name + '</span>' +
        '<div class="check"></div>';
      row.addEventListener('click', function () {
        document.querySelectorAll('.bank-row').forEach(function (r) { r.classList.remove('selected'); });
        row.classList.add('selected');
        selectedBankCode = bank.code;
      });
      bankListEl.appendChild(row);
      if (index === 0) selectedBankCode = bank.code;
    });
  }

  async function loadConfig() {
    var origins = [];
    if (window.ERIKBANK_PORTAL) origins.push(window.ERIKBANK_PORTAL);
    origins.push('http://localhost:8085');
    if (window.location.origin && window.location.origin !== 'null') {
      origins.push(window.location.origin);
    }

    for (var i = 0; i < origins.length; i += 1) {
      var origin = origins[i];
      try {
        var cfgResp = await fetch(origin + '/api/config');
        if (cfgResp.ok) {
          var cfg = await cfgResp.json();
          apiBase = cfg.paymentRouterUrl || apiBase;
          return;
        }
      } catch (_err) {
        /* try next origin */
      }
    }
  }

  async function loadBanks() {
    try {
      var resp = await fetch(apiBase + '/api/banks?method=' + PAYMENT.method);
      if (!resp.ok) throw new Error('Could not load banks');
      var data = await resp.json();
      renderBanks(data.banks || []);
    } catch (err) {
      setStatus('Bank list unavailable. Start the ErikBank stack (./erikbank/scripts/start-local.sh).', 'error');
    }
  }

  async function submitPayment() {
    if (!payBtn) return;
    payBtn.disabled = true;
    setStatus('Routing payment through fraud, compliance, and core banking…', 'pending');

    try {
      var resp = await fetch(apiBase + '/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payeeName: PAYMENT.payeeName,
          amountCents: PAYMENT.amountCents,
          currency: PAYMENT.currency,
          method: PAYMENT.method,
          bankCode: selectedBankCode
        })
      });

      var result = await resp.json();
      if (!resp.ok) {
        throw new Error(result.message || result.error || 'Payment failed');
      }

      lastPayment = result;
      var amount = formatAmount(result.amountCents);
      setStatus(
        result.message + ' Ref ' + result.paymentRef + ' · fraud ' + result.fraudScore + ' · ' + result.routingChannel,
        'success'
      );

      if (qrTextEl) {
        qrTextEl.innerHTML = 'Scan with your ErikBank app to pay <strong>€' + amount.whole + ',' + amount.fraction + '</strong> to ' + PAYMENT.payeeName + '<br><small>' + (result.qrPayload || '') + '</small>';
      }
    } catch (err) {
      setStatus(err.message || 'Payment could not be completed.', 'error');
    } finally {
      payBtn.disabled = false;
    }
  }

  document.querySelectorAll('.tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
      var panel = document.getElementById('panel-' + tab.dataset.tab);
      if (panel) panel.classList.add('active');
    });
  });

  if (payBtn) {
    payBtn.addEventListener('click', submitPayment);
  }

  loadConfig().then(loadBanks);
})();
