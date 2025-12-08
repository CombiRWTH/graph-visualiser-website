import { useCallback, useRef, useState, useEffect } from "react";

export function useAutoStepper(step: () => void): {
	play: () => void;
	pause: () => void;
	changeFreq: (freq: number) => void;
	freq: number;
	playing: boolean;
} {
	const intervalRef = useRef<number>();
	const [freq, setFreq] = useState(1000);
	const [playing, setPlaying] = useState(false);

	// stop stepper on unmount
	useEffect(() => pause, []);

	const play = useCallback(() => {
		if (playing) clearInterval(intervalRef.current);
		intervalRef.current = window.setInterval(step, freq);
		setPlaying(true);
	}, [freq, setFreq]);

	const pause = useCallback(() => {
		clearInterval(intervalRef.current);
		setPlaying(false);
	}, []);

	const changeFreq = useCallback(
		(newFreq: number) => {
			setFreq(newFreq);
			if (playing) {
				// reset interval
				clearInterval(intervalRef.current);
				intervalRef.current = window.setInterval(step, newFreq);
			}
		},
		[freq, setFreq, playing, intervalRef]
	);

	return {
		play,
		pause,
		changeFreq,
		freq,
		playing,
	};
}
