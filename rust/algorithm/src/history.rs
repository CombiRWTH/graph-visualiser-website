/// Module to store visualization states and line of pseudo code
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct History<P, VS> {
	// (Pseudocode, Visualization State)
	snapshots: Vec<(P, VS)>,
	current: usize
}

impl<P: Clone, VS: Clone> History<P, VS> {
	pub fn new() -> History<P, VS> {
		History {
			snapshots: Vec::new(),
			current: 0
		}
	}

	pub fn push(&mut self, pseudocode: &P, vis_state: &VS) {
		let snapshot = vis_state.clone();
		let line = pseudocode.clone();
		self.snapshots.push((line, snapshot));
	}

	pub fn current_vis_state(&self) -> Option<&VS> {
		if self.is_empty() {
			return None;
		}
		Some(&self.snapshots[self.current].1)
	}

	pub fn current_pseudocode(&self) -> Option<&P> {
		if self.is_empty() {
			return None;
		}
		Some(&self.snapshots[self.current].0)
	}

	/// Return true if we actually traverse in the history forward
	pub fn next(&mut self) -> bool {
		if self.current < self.snapshots.len() - 1 {
			self.current += 1;
			return true;
		}
		false
	}

	/// Return true if we actually traverse in the history backward
	pub fn prev(&mut self) -> bool {
		if self.current > 0 {
			self.current -= 1;
			return true;
		}
		false
	}

	pub fn reset(&mut self) {
		self.snapshots = Vec::new();
		self.current = 0;
	}

	pub fn is_empty(&self) -> bool {
		self.snapshots.len() == 0
	}
}
