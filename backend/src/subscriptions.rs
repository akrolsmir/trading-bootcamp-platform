use std::sync::{Arc, RwLock};

use axum::extract::ws;
use fxhash::FxHashMap;
use tokio::sync::{broadcast, watch};

const MARKETS_BROADCAST_BUFFER_SIZE: usize = 256;
const PAYMENT_BROADCAST_BUFFER_SIZE: usize = 16;

#[derive(Clone)]
pub struct Subscriptions {
    inner: Arc<SubscriptionsInner>,
}

struct SubscriptionsInner {
    /// user id -> `watch::Sender<()>`
    portfolio: RwLock<FxHashMap<String, watch::Sender<()>>>,
    /// contains serialized protobuf `Market`, `MarketSettled`, `OrderCreated` and `OrderCanceled`
    public: broadcast::Sender<ws::Message>,
    /// user id -> serialized protobuf Payment
    payments: RwLock<FxHashMap<String, broadcast::Sender<ws::Message>>>,
}

// TODO: this leaks memory on the order of the number of users, which should be ok for a bootcamp
impl Subscriptions {
    #[must_use]
    pub fn new() -> Self {
        let public = broadcast::Sender::new(MARKETS_BROADCAST_BUFFER_SIZE);
        Self {
            inner: Arc::new(SubscriptionsInner {
                portfolio: RwLock::default(),
                public,
                payments: RwLock::default(),
            }),
        }
    }

    /// # Panics
    /// Panics if the lock is poisoned.
    #[must_use]
    pub fn subscribe_portfolio(&self, user_id: &str) -> watch::Receiver<()> {
        if let Some(sender) = self.inner.portfolio.read().unwrap().get(user_id) {
            return sender.subscribe();
        }
        let mut write = self.inner.portfolio.write().unwrap();
        // another writer might have added it in the meantime
        if let Some(sender) = write.get(user_id) {
            return sender.subscribe();
        }
        let (sender, receiver) = watch::channel(());
        write.insert(user_id.to_string(), sender);
        receiver
    }

    /// # Panics
    /// Panics if the lock is poisoned.
    pub fn notify_user_portfolio(&self, user_id: &str) {
        if let Some(sender) = self.inner.portfolio.read().unwrap().get(user_id) {
            sender.send(()).ok();
        }
    }

    #[must_use]
    pub fn subscribe_public(&self) -> broadcast::Receiver<ws::Message> {
        self.inner.public.subscribe()
    }

    pub fn send_public(&self, data: ws::Message) {
        self.inner.public.send(data).ok();
    }

    /// # Panics
    /// Panics if the lock is poisoned.
    #[must_use]
    pub fn subscribe_payments(&self, user_id: &str) -> broadcast::Receiver<ws::Message> {
        if let Some(sender) = self.inner.payments.read().unwrap().get(user_id) {
            return sender.subscribe();
        }
        let mut write = self.inner.payments.write().unwrap();
        // another writer might have added it in the meantime
        if let Some(sender) = write.get(user_id) {
            return sender.subscribe();
        }
        let (sender, receiver) = broadcast::channel(PAYMENT_BROADCAST_BUFFER_SIZE);
        write.insert(user_id.to_string(), sender);
        receiver
    }

    /// # Panics
    /// Panics if the lock is poisoned.
    pub fn send_payment(&self, user_id: &str, data: ws::Message) {
        if let Some(sender) = self.inner.payments.read().unwrap().get(user_id) {
            sender.send(data).ok();
        }
    }
}

impl Default for Subscriptions {
    fn default() -> Self {
        Self::new()
    }
}
