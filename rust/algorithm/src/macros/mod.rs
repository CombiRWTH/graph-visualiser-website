mod export_algorithm_to_wasm;

/// Log a message to the JavaScript console.
#[macro_export]
macro_rules! console_log {
    ($($t:tt)*) => {
		$crate::private::console_log(&format!($($t)*).into())
	};
}
