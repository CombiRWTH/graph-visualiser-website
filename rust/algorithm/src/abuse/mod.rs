mod waker;

use parking_lot::Mutex;
use std::{
	future::Future,
	pin::Pin,
	sync::Arc,
	task::{Context, Poll}
};
use waker::AbuseWaker;

/// A state machine that abuses Rust futures to yield intermediate states.
pub struct StateMachine<P, VS> {
	/// This is the future we're executing.
	fut: Pin<Box<dyn Future<Output = ()> + Send>>,
	/// This stores the states yielded by the future.
	states: States<P, VS>
}

impl<P, VS> StateMachine<P, VS> {
	/// Create a new state machine.
	pub fn new<I, F>(init: I) -> Self
	where
		I: FnOnce(States<P, VS>) -> F,
		F: Future<Output = ()> + Send + 'static
	{
		let states = States::new();
		Self {
			fut: Box::pin(init(states.clone())),
			states
		}
	}

	/// Run the state machine until it reaches the next state. When there are no further
	/// states available, it returns `None`.
	pub fn poll(&mut self) -> Option<(P, VS)> {
		let waker = AbuseWaker::into_waker(Arc::new(AbuseWaker::new()));
		let mut ctx = Context::from_waker(&waker);

		match Future::poll(self.fut.as_mut(), &mut ctx) {
			// future is ready - no more states
			Poll::Ready(()) => None,
			// future is not ready - we get more data
			Poll::Pending => {
				println!("poll() is reading a state");
				let Some(state) = self.states.get() else {
					panic!("Sorry, but this StateMachine executor only supports .await on yield_state()");
				};
				Some(state)
			}
		}
	}
}

/// Storage for the states of a state machine.
pub struct States<P, VS> {
	/// This stores the current state being yielded.
	ptr: Arc<Mutex<Option<(P, VS)>>>
}

impl<P, VS> States<P, VS> {
	fn new() -> Self {
		Self {
			ptr: Arc::new(Mutex::new(None))
		}
	}

	fn clone(&self) -> Self {
		Self {
			ptr: Arc::clone(&self.ptr)
		}
	}

	fn get(&self) -> Option<(P, VS)> {
		self.ptr.lock().take()
	}

	/// Yield a state. This interrupts the state machine to return the state passed to
	/// this function.
	///
	/// In order to function correctly, this function needs to be immediately `await`-ed!
	pub fn yield_state(&self, pseudocode_line: P, state: VS) -> impl Future<Output = ()> {
		let mut ptr = self.ptr.lock();
		assert!(ptr.is_none());
		*ptr = Some((pseudocode_line, state));

		Yield { ready: false }
	}
}

/// This future is used to yield a state. It returns [`Poll::Pending`] exactly once, and
/// [`Poll::Ready(())`] on all subsequent polls.
struct Yield {
	ready: bool
}

impl Future for Yield {
	type Output = ();

	fn poll(mut self: Pin<&mut Self>, _: &mut Context<'_>) -> Poll<Self::Output> {
		if self.ready {
			Poll::Ready(())
		} else {
			self.ready = true;
			Poll::Pending
		}
	}
}

#[cfg(test)]
mod tests {
	use super::*;

	async fn do_stuff(states: States<usize, Vec<u32>>) {
		let mut vec: Vec<u32> = vec![1, 2, 3];
		states.yield_state(0, vec.clone()).await;
		vec.push(4);
		states.yield_state(1, vec.clone()).await;
	}

	#[test]
	fn test() {
		let mut states = Vec::new();
		let mut state_machine = StateMachine::new(do_stuff);
		while let Some(state) = state_machine.poll() {
			states.push(state);
		}
		assert_eq!(&states, &[(0, vec![1, 2, 3]), (1, vec![1, 2, 3, 4]),]);
	}
}
