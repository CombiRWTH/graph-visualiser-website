use std::{
	sync::Arc,
	task::{RawWaker, RawWakerVTable, Waker}
};

/// An absolutely useless waker. Never call any functions on this waker.
pub(crate) struct AbuseWaker;

impl AbuseWaker {
	const VTABLE: RawWakerVTable = RawWakerVTable::new(Self::clone, Self::wake, Self::wake_by_ref, Self::drop);

	pub(crate) fn new() -> Self {
		Self
	}

	pub(crate) fn into_waker(waker_arc: Arc<Self>) -> Waker {
		unsafe { Waker::from_raw(RawWaker::new(Arc::into_raw(waker_arc) as *const (), &Self::VTABLE)) }
	}

	unsafe fn clone(waker_ptr: *const ()) -> RawWaker {
		let waker_ptr = waker_ptr as *const Self;
		Arc::increment_strong_count(waker_ptr);
		RawWaker::new(waker_ptr as *const (), &Self::VTABLE)
	}

	unsafe fn wake(waker_ptr: *const ()) {
		Self::drop(waker_ptr);
		unimplemented!()
	}

	unsafe fn wake_by_ref(_waker_ptr: *const ()) {
		unimplemented!()
	}

	unsafe fn drop(waker_ptr: *const ()) {
		Arc::decrement_strong_count(waker_ptr);
	}
}
