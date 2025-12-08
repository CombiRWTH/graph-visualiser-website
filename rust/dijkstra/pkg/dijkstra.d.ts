/* tslint:disable */
/* eslint-disable */
/**
 * initialise panic handler
 */
export function init_panic_handler(): void;
/**
 * Return the pseudo code for this algorithm.
 */
export function getPseudoCode(): Array<any>;
/**
 * Return the requirements that this algorithm has regarding the graph
 * properties.
 */
export function getGraphPropertyRequirements(): PropertyRequirements;
/**
 * Set a graph and start node to start a new algorithm.
 *
 * In case you want to restart the algorithm, don't forget to call the drop state
 * function on the old instance first to free up resources.
 */
export function setGraph(graph: any, start_node: number): any;
/**
 * Compute the next step of the algorithm. This method returns a new state. You
 * must not use the state passed as an argument to this method anymore.
 *
 * When the algorithm finishes, the next call to this method after its last step
 * will set the line to `None`. You must not call this method afterwards.
 *
 * This method will fail if the state is invalid. States become invalid when
 * the algorithm is finished, or when you call the drop state function.
 */
export function nextStep(state: any): any;
export function prevStep(state: any): any;
/**
 * Drop the state. This method should be called when an algorithm will not be
 * used anymore to free up memory resources. You must not call the next step
 * function after dropping the state.
 */
export function dropState(state: any): void;
/**
 * Get the number of example graphs that come with this algorithm.
 */
export function getListLen(): number;
/**
 * Get an example graph by its index. The index must be between 0 and the return
 * value of the example count function.
 */
export function getExampleGraph(index: number): any;
/**
 * mark the current shortest path
 */
export function markShortestPath(state: any, node_id: number): any;
/**
 * unmark the current shortest path
 */
export function unmarkShortestPath(state: any): any;
export function properties_compatible(_this: Properties, requirements: PropertyRequirements): boolean;
/**
 * Check whether a property is contained in the properties set.
 */
export function properties_contains(_this: Properties, prop: Property): boolean;
/**
 * Get all properties of the graph.
 */
export function graph_properties(graph: any): Properties;
export enum Property {
  UnweightedLinks = 0,
  PositiveWeightedLinks = 1,
  NonNegativeWeightedLinks = 2,
  WeightedLinks = 3,
  Connected = 4,
  Unconnected = 5,
  Empty = 6,
  Complete = 7,
  NotComplete = 8,
}
export class Node {
  free(): void;
  constructor(id: number, name: string);
  id: number;
  name: string;
}
/**
 * A set of properties.
 */
export class Properties {
  private constructor();
  free(): void;
}
export class PropertyRequirements {
  private constructor();
  free(): void;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly getPseudoCode: () => any;
  readonly getGraphPropertyRequirements: () => number;
  readonly nextStep: (a: any) => [number, number, number];
  readonly prevStep: (a: any) => [number, number, number];
  readonly getListLen: () => number;
  readonly markShortestPath: (a: any, b: number) => any;
  readonly init_panic_handler: () => void;
  readonly setGraph: (a: any, b: number) => any;
  readonly dropState: (a: any) => void;
  readonly getExampleGraph: (a: number) => any;
  readonly unmarkShortestPath: (a: any) => any;
  readonly __wbg_propertyrequirements_free: (a: number, b: number) => void;
  readonly properties_compatible: (a: number, b: number) => number;
  readonly __wbg_properties_free: (a: number, b: number) => void;
  readonly properties_contains: (a: number, b: number) => number;
  readonly graph_properties: (a: any) => number;
  readonly __wbg_node_free: (a: number, b: number) => void;
  readonly __wbg_get_node_id: (a: number) => number;
  readonly __wbg_set_node_id: (a: number, b: number) => void;
  readonly __wbg_get_node_name: (a: number) => [number, number];
  readonly __wbg_set_node_name: (a: number, b: number, c: number) => void;
  readonly node_new: (a: number, b: number, c: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_3: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __externref_table_dealloc: (a: number) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
