import { AngularOptions, ClientBuilder, ClientDependenciesBuilder, ClientExtraFilesBuilder, ClientFooterBuilder, ClientGeneratorsBuilder, ClientHeaderBuilder, ContextSpec, GeneratorImport, GeneratorVerbOptions, NormalizedOutputOptions, ResReqTypesValue, Verbs } from "@orval/core";
//#region src/base-url.d.ts
/** `example-api` -> `EXAMPLE_API` — the shared constant-case prefix for every generated identifier. */
declare const getBaseUrlConstantPrefix: (apiId: string) => string;
/** `example-api` -> `EXAMPLE_API_SERVER_URL` */
declare const getBaseUrlServerUrlConstantName: (apiId: string) => string;
/** `example-api` -> `EXAMPLE_API_BASE_URL` */
declare const getBaseUrlTokenName: (apiId: string) => string;
/** `example-api` -> `EXAMPLE_API_BASE_URL_RESOLVER` */
declare const getBaseUrlResolverTokenName: (apiId: string) => string;
/** `example-api` -> `ExampleApiBaseUrlResolver` (resolver function type name) */
declare const getBaseUrlResolverTypeName: (apiId: string) => string;
/** `example-api` -> `ExampleApiBaseUrlResolverContext` (resolver context type name) */
declare const getBaseUrlResolverContextTypeName: (apiId: string) => string;
/** `example-api` -> `provideExampleApiBaseUrl` */
declare const getProvideBaseUrlName: (apiId: string) => string;
/** `example-api` -> `provideExampleApiBaseUrlResolver` */
declare const getProvideBaseUrlResolverName: (apiId: string) => string;
/**
 * Builds the full generated source for a `<target>.base-url.ts` file.
 *
 * The emitted module exposes, purely through Angular DI, the precedence chain
 * documented in `override.angular.baseUrl`'s guide:
 *
 * 1. A directly provided `<API_ID>_BASE_URL` token value (`provideXBaseUrl`) —
 *    wins outright; the resolver below is never invoked.
 * 2. A directly provided `<API_ID>_BASE_URL_RESOLVER` (`provideXBaseUrlResolver`).
 * 3. The default resolver factory, which returns the embedded spec server URL.
 * 4. The embedded `<API_ID>_SERVER_URL` constant (`''` when the specification
 *    has no `servers` entry), passed to whichever resolver above ends up running.
 *
 * All exported members carry explicit return types and no `any`, matching the
 * rest of the generated Angular output.
 */
declare const buildAngularBaseUrlFileContent: ({ apiId, serverUrl }: {
  apiId: string;
  serverUrl: string;
}) => string;
/**
 * Path of the generated `<target>.base-url.ts` file for the current output.
 *
 * Unlike the `httpResource` extra-file mechanism (one sibling file per tag in
 * `tags` / `tags-split` mode), there is exactly one base-URL file per output —
 * the DI tokens it exports are shared by every generated file regardless of mode.
 */
declare const getAngularBaseUrlFilePath: (output: NormalizedOutputOptions) => string;
/**
 * Import specifier a generated implementation file uses to reach the
 * base-URL file produced by {@link getAngularBaseUrlFilePath}.
 *
 * Always authored as if the importing file sat next to the base-URL file
 * (i.e. directly in `<dirname>`) — this matches `single`/`split`/`tags` mode,
 * where implementation files are in fact siblings. `tags-split` mode nests
 * implementation files one directory below (`<dirname>/<tag>/<tag>.ts`), but
 * the `tags-split` writer (`writers/split-tags-mode.ts`) already generically
 * re-resolves every relative `GeneratorImport.importPath` — originally
 * authored relative to `dirname` — against the operation's actual nested
 * file location. Special-casing `'../'` here as well would double-apply that
 * shift and produce a broken `../../` import.
 */
declare const getAngularBaseUrlImportSpecifier: (output: NormalizedOutputOptions) => string;
/**
 * Emits the opt-in `<target>.base-url.ts` extra file when
 * `override.angular.baseUrl` is configured; a zero-cost no-op (`[]`) otherwise.
 *
 * @returns Zero or one `ClientFileBuilder` describing the generated base-URL file.
 */
declare const generateAngularBaseUrlExtraFiles: ClientExtraFilesBuilder;
//#endregion
//#region src/constants.d.ts
declare const ANGULAR_HTTP_CLIENT_DEPENDENCIES: readonly [{
  readonly exports: readonly [{
    readonly name: "HttpClient";
    readonly values: true;
  }, {
    readonly name: "HttpParams";
  }, {
    readonly name: "HttpContext";
  }, {
    readonly name: "HttpEvent";
  }];
  readonly dependency: "@angular/common/http";
}, {
  readonly exports: readonly [{
    readonly name: "Injectable";
    readonly values: true;
  }, {
    readonly name: "inject";
    readonly values: true;
  }];
  readonly dependency: "@angular/core";
}, {
  readonly exports: readonly [{
    readonly name: "Observable";
  }];
  readonly dependency: "rxjs";
}];
declare const ANGULAR_HTTP_RESOURCE_DEPENDENCIES: readonly [{
  readonly exports: readonly [{
    readonly name: "httpResource";
    readonly values: true;
  }, {
    readonly name: "HttpResourceOptions";
  }, {
    readonly name: "HttpResourceRef";
  }, {
    readonly name: "HttpResourceRequest";
  }, {
    readonly name: "HttpHeaders";
    readonly values: true;
  }, {
    readonly name: "HttpParams";
  }, {
    readonly name: "HttpContext";
  }];
  readonly dependency: "@angular/common/http";
}, {
  readonly exports: readonly [{
    readonly name: "Signal";
  }, {
    readonly name: "ResourceStatus";
  }, {
    readonly name: "inject";
    readonly values: true;
  }];
  readonly dependency: "@angular/core";
}];
//#endregion
//#region src/utils.d.ts
type ClientOverride = 'httpClient' | 'httpResource' | 'both';
declare const PRIMITIVE_TYPE_VALUES: readonly ["string", "number", "boolean", "void", "unknown"];
type PrimitiveType = (typeof PRIMITIVE_TYPE_VALUES)[number];
declare const PRIMITIVE_TYPES: Set<"string" | "number" | "boolean" | "void" | "unknown">;
/**
 * Narrows a schema type string to the primitive set supported by the Angular
 * generators' query/header helpers.
 */
declare const isPrimitiveType: (t: string | undefined) => t is PrimitiveType;
/**
 * Indicates whether the configured schema output target is Zod-based.
 */
declare const isZodSchemaOutput: (output: NormalizedOutputOptions) => boolean;
/**
 * Removes `null` and `undefined` from a value in a type-safe way.
 */
declare const isDefined: <T>(v: T | null | undefined) => v is T;
/**
 * Maps a schema type name to its Zod output-type reference (`${typeName}Output`).
 */
declare const getSchemaOutputTypeRef: (typeName: string) => string;
/**
 * Converts an operation/tag title into the generated Angular service class name.
 */
declare const generateAngularTitle: (title: string) => string;
/**
 * Builds the opening of an @Injectable Angular service class.
 * Shared between httpClient-only mode and the mutation section of httpResource mode.
 */
declare const buildServiceClassOpen: ({ title, isRequestOptions, isMutator, isGlobalMutator, provideIn, hasQueryParams, baseUrlFieldInitializer, hasObjectParams }: {
  title: string;
  isRequestOptions: boolean;
  isMutator: boolean;
  isGlobalMutator: boolean;
  provideIn: string | boolean | undefined;
  hasQueryParams: boolean;
  /**
   * When set, injected as an additional `private readonly baseUrl = ...;`
   * class field — used by `httpResource`-mode mutation-service classes to
   * pick up the same base-URL DI token as their sibling `HttpClient` output.
   */
  baseUrlFieldInitializer?: string;
  /**
   * Whether the emitted helper needs the object-serialization overload
   * (issue #3705). Only meaningful when `hasQueryParams` is `true`.
   */
  hasObjectParams?: boolean;
}) => string;
/**
 * Registry that maps operationName → full route (with baseUrl).
 *
 * Populated during client builder calls (which receive the full route via
 * GeneratorOptions.route) and read during header/footer builder calls
 * (which only receive verbOptions without routes).
 *
 * This avoids monkey-patching verbOptions with a non-standard `fullRoute` property.
 */
declare const createRouteRegistry: () => {
  reset(): void;
  set(operationName: string, route: string): void;
  get(operationName: string, fallback: string): string;
};
/**
 * Returns only the operations that belong to the current tag output.
 *
 * Tag matching is delegated to {@link isOperationInTagBucket}, the single source
 * of truth for tag-bucket identity. Untagged operations resolve to the implicit
 * `default` bucket, matching how the core writer routes them in
 * `tags` / `tags-split` mode.
 */
declare const getRelevantVerbOptionsForTag: (verbOptions: Record<string, GeneratorVerbOptions>, tag?: string) => GeneratorVerbOptions[];
declare const createReturnTypesRegistry: () => {
  reset(): void;
  set(operationName: string, typeDefinition: string): void;
  getFooter(operationNames: string[]): string;
};
/**
 * Determines whether an operation should be generated as an `httpResource()`
 * (retrieval) or as an `HttpClient` method in a service class (mutation).
 *
 * Resolution order:
 * 1. **Per-operation override** — `override.operations.<operationId>.angular.client`
 *    in the orval config. `httpResource` forces retrieval, `httpClient` forces mutation.
 * 2. **HTTP verb** — absent a per-operation override, `GET` is treated as a retrieval.
 * 3. **Name heuristic** — For `POST`, if the operationName starts with a
 *    retrieval-like prefix (search, list, find, query, get, fetch, lookup)
 *    it is treated as a retrieval. This handles common patterns like
 *    `POST /search` or `POST /graphql` with query-style operation names.
 *
 * If the heuristic misclassifies an operation, users can override it
 * per-operation in their orval config:
 *
 * ```ts
 * override: {
 *   operations: {
 *     myPostSearch: { angular: { retrievalClient: 'httpResource' } },
 *     getOrCreateUser: { angular: { retrievalClient: 'httpClient' } },
 *   }
 * }
 * ```
 */
declare function isRetrievalVerb(verb: Verbs, operationName?: string, clientOverride?: ClientOverride): boolean;
declare function isMutationVerb(verb: Verbs, operationName?: string, clientOverride?: ClientOverride): boolean;
/**
 * Selects the preferred success payload type for Angular `httpResource`
 * generation, favouring JSON responses and otherwise falling back to the
 * generator's default content-type rules.
 */
declare function getDefaultSuccessType(successTypes: ResReqTypesValue[], fallback: string): {
  contentType: string;
  value: string;
};
//#endregion
//#region src/http-client.d.ts
/**
 * Narrowed context for `generateHttpClientImplementation`.
 *
 * The implementation only reads `context.output`, so callers don't need
 * to supply a full `ContextSpec` (which also requires `target`, `workspace`,
 * `spec`, etc.).
 *
 * @remarks
 * This keeps the call sites lightweight when `http-resource.ts` delegates
 * mutation generation back to the shared `HttpClient` implementation builder.
 */
interface HttpClientGeneratorContext {
  route: string;
  context: Pick<ContextSpec, 'output'>;
}
/**
 * Returns the dependency list required by the Angular `HttpClient` generator.
 *
 * These imports are consumed by Orval's generic dependency-import emitter when
 * composing the generated Angular client file.
 *
 * @returns The Angular `HttpClient` dependency descriptors used during import generation.
 */
declare const getAngularDependencies: ClientDependenciesBuilder;
/**
 * Builds the generated TypeScript helper name used for multi-content-type
 * `Accept` header unions.
 *
 * Example: `listPets` -> `ListPetsAccept`.
 *
 * @returns A PascalCase helper type/const name for the operation's `Accept` values.
 */
declare const getAcceptHelperName: (typeName: string) => string;
/**
 * Collects the distinct successful response content types for a single
 * operation.
 *
 * The Angular generators use this to decide whether they need `Accept`
 * overloads or content-type-specific branching logic.
 *
 * @returns A de-duplicated list of response content types, excluding empty entries.
 */
declare const getUniqueContentTypes: (successTypes: GeneratorVerbOptions["response"]["types"]["success"]) => string[];
/**
 * Builds the shared `Accept` helper declarations for all operations in the
 * current Angular generation scope.
 *
 * @remarks
 * Helpers are emitted only for operations with more than one successful
 * response content type.
 *
 * @returns Concatenated type/const declarations or an empty string when no helpers are needed.
 */
declare const buildAcceptHelpers: (verbOptions: readonly GeneratorVerbOptions[], output: ContextSpec["output"]) => string;
/**
 * Generates the static header section for Angular `HttpClient` output.
 *
 * Depending on the current generation options this may include:
 * - reusable request option helper types
 * - filtered query-param helper utilities
 * - mutator support types
 * - `Accept` helper unions/constants for multi-content-type operations
 * - the `@Injectable()` service class shell
 *
 * @returns A string containing the prelude and service class opening for the generated file.
 */
declare const generateAngularHeader: ClientHeaderBuilder;
/**
 * Generates the closing section for Angular `HttpClient` output.
 *
 * @remarks
 * Besides closing the generated service class, this appends any collected
 * `ClientResult` aliases registered while individual operations were emitted.
 *
 * @returns The footer text for the generated Angular client file.
 */
declare const generateAngularFooter: ClientFooterBuilder;
/**
 * Generates the Angular `HttpClient` method implementation for a single
 * OpenAPI operation.
 *
 * This function is responsible for:
 * - method signatures and overloads
 * - observe-mode branching
 * - multi-content-type `Accept` handling
 * - mutator integration
 * - runtime Zod validation hooks for Angular output
 * - registering the operation's `ClientResult` alias for footer emission
 *
 * @remarks
 * This is the central implementation builder shared by the dedicated
 * `httpClient` mode and the mutation side of Angular `both` / `httpResource`
 * generation.
 *
 * @returns The complete TypeScript method declaration and implementation for the operation.
 */
declare const generateHttpClientImplementation: ({ headers, queryParams, operationName, typeName, response, mutator, body, props, verb, override, formData, formUrlEncoded, paramsSerializer, paramsFilter, params }: GeneratorVerbOptions, { route: _route, context }: HttpClientGeneratorContext) => string;
/**
 * Whether the rendered HttpClient method narrows `HttpEvent`s with
 * `instanceof AngularHttpResponse`. Mirrors `generateHttpClientImplementation`:
 * the `observe` branches exist only with request options and a single content
 * type, and the narrowing is part of the runtime-validation pipe. Lets callers
 * decide the `HttpResponse` import without rendering the method, which would
 * also register its `ClientResult` alias ahead of the footer.
 */
declare const narrowsResponseEvents: ({ response, override }: Pick<GeneratorVerbOptions, "response" | "override">, output: NormalizedOutputOptions) => boolean;
/** `HttpResponse` (aliased `AngularHttpResponse`), a value only where events are narrowed. */
declare const getAngularHttpResponseImport: (narrowsEvents: boolean) => GeneratorImport;
/**
 * The `@angular/common/http` bindings whose value-or-type status depends on
 * the operation: `HttpHeaders` (multi-content `Accept` dispatch narrows on it
 * in the rendered body) and `HttpResponse` (see `narrowsResponseEvents`).
 */
declare const getAngularHttpImports: (implementation: string, narrowsEvents: boolean) => GeneratorImport[];
/**
 * Orval client builder entry point for Angular `HttpClient` output.
 *
 * It normalizes imports needed for runtime validation, delegates the actual
 * method implementation to `generateHttpClientImplementation`, and returns the
 * generated code plus imports for the current operation.
 *
 * @returns The generated implementation fragment and imports for one operation.
 */
declare const generateAngular: ClientBuilder;
/**
 * Returns the footer aliases collected for the provided operation names.
 *
 * The Angular generators use these aliases to expose stable `ClientResult`
 * helper types such as `ListPetsClientResult`.
 *
 * @returns Concatenated `ClientResult` aliases for the requested operation names.
 */
declare const getHttpClientReturnTypes: (operationNames: string[]) => string;
/**
 * Clears the module-level return type registry used during Angular client
 * generation.
 *
 * This must be called at the start of each generation pass to avoid leaking
 * aliases across files or tags.
 *
 * @returns Nothing.
 */
declare const resetHttpClientReturnTypes: () => void;
//#endregion
//#region src/http-resource.d.ts
/** @internal Exported for testing only */
declare const routeRegistry: {
  reset(): void;
  set(operationName: string, route: string): void;
  get(operationName: string, fallback: string): string;
};
/**
 * Returns the merged dependency list required when Angular `httpResource`
 * output coexists with Angular `HttpClient` service generation.
 *
 * This is used for pure `httpResource` mode as well as mixed generation paths
 * that still need Angular common HTTP symbols and service helpers.
 *
 * @returns The de-duplicated dependency descriptors for Angular resource generation.
 */
declare const getAngularHttpResourceDependencies: ClientDependenciesBuilder;
/**
 * Returns only the dependencies required by standalone generated resource
 * files, such as the sibling `*.resource.ts` output used in `both` mode.
 *
 * @returns The dependency descriptors required by resource-only files.
 */
declare const getAngularHttpResourceOnlyDependencies: ClientDependenciesBuilder;
/**
 * Generates the header section for Angular `httpResource` output.
 *
 * @remarks
 * Resource functions are emitted in the header phase because their final shape
 * depends on the full set of operations in scope, including generated `Accept`
 * helpers and any shared mutation service methods.
 *
 * @returns The generated header, resource helpers, optional mutation service class, and resource result aliases.
 */
declare const generateHttpResourceHeader: ClientHeaderBuilder;
/**
 * Generates the footer for Angular `httpResource` output.
 *
 * The footer appends any registered `ClientResult` aliases coming from shared
 * `HttpClient` mutation methods and the resource-state helper utilities emitted
 * for generated Angular resources.
 *
 * @returns The footer text for the generated Angular resource file.
 */
declare const generateHttpResourceFooter: ClientFooterBuilder;
/**
 * Per-operation builder used during Angular `httpResource` generation.
 *
 * Unlike the `HttpClient` builder, the actual implementation body is emitted in
 * the header phase after all operations are known. This function mainly records
 * the resolved route and returns the imports required by the current operation.
 *
 * @returns An empty implementation plus the imports required by the operation.
 */
declare const generateHttpResourceClient: ClientBuilder;
/**
 * Generates the extra sibling resource files used by Angular `both` mode.
 *
 * @remarks
 * The main generated file keeps the `HttpClient` service class while retrieval
 * resources are emitted into `*.resource.ts` so consumers can opt into both
 * access patterns without mixing the generated surfaces. In tag-based output
 * modes this emits one sibling resource file per generated tag file.
 *
 * @returns One or more extra file descriptors representing generated resource files.
 */
declare const generateHttpResourceExtraFiles: ClientExtraFilesBuilder;
//#endregion
//#region src/types.d.ts
/**
 * Code template for the `HttpClientOptions` interface emitted into generated files.
 *
 * This is NOT an import of Angular's type — Angular's HttpClient methods accept
 * inline option objects, not a single unified interface. Orval generates this
 * convenience wrapper so users have a single referenceable type.
 *
 * Properties sourced from Angular HttpClient public API (angular/angular
 * packages/common/http/src/client.ts).
 */
declare const HTTP_CLIENT_OPTIONS_TEMPLATE = "interface HttpClientOptions {\n  readonly headers?: HttpHeaders | Record<string, string | string[]>;\n  readonly context?: HttpContext;\n  readonly params?:\n        | HttpParams\n      | Record<string, string | number | boolean | Array<string | number | boolean>>;\n  readonly reportProgress?: boolean;\n  readonly withCredentials?: boolean;\n  readonly credentials?: RequestCredentials;\n  readonly keepalive?: boolean;\n  readonly priority?: RequestPriority;\n  readonly cache?: RequestCache;\n  readonly mode?: RequestMode;\n  readonly redirect?: RequestRedirect;\n  readonly referrer?: string;\n  readonly integrity?: string;\n  readonly referrerPolicy?: ReferrerPolicy;\n  readonly transferCache?: {includeHeaders?: string[]} | boolean;\n  readonly timeout?: number;\n}";
/**
 * Code templates for reusable observe option helpers emitted into generated files.
 */
declare const HTTP_CLIENT_OBSERVE_OPTIONS_TEMPLATE = "type HttpClientBodyOptions = HttpClientOptions & {\n  readonly observe?: 'body';\n};\n\ntype HttpClientEventOptions = HttpClientOptions & {\n  readonly observe: 'events';\n};\n\ntype HttpClientResponseOptions = HttpClientOptions & {\n  readonly observe: 'response';\n};\n\ntype HttpClientObserveOptions = HttpClientOptions & {\n  readonly observe?: 'body' | 'events' | 'response';\n};";
/**
 * Code template for the `ThirdParameter` utility type used with custom mutators.
 */
declare const THIRD_PARAMETER_TEMPLATE = "// eslint-disable-next-line\n    type ThirdParameter<T extends (...args: never[]) => unknown> = T extends (\n  config: unknown,\n  httpClient: unknown,\n  args: infer P,\n) => unknown\n  ? P\n  : never;";
//#endregion
//#region src/index.d.ts
declare const builder: () => (options?: AngularOptions) => ClientGeneratorsBuilder;
//#endregion
export { ANGULAR_HTTP_CLIENT_DEPENDENCIES, ANGULAR_HTTP_RESOURCE_DEPENDENCIES, ClientOverride, HTTP_CLIENT_OBSERVE_OPTIONS_TEMPLATE, HTTP_CLIENT_OPTIONS_TEMPLATE, HttpClientGeneratorContext, PRIMITIVE_TYPES, PrimitiveType, THIRD_PARAMETER_TEMPLATE, buildAcceptHelpers, buildAngularBaseUrlFileContent, buildServiceClassOpen, builder, builder as default, createReturnTypesRegistry, createRouteRegistry, generateAngular, generateAngularBaseUrlExtraFiles, generateAngularFooter, generateAngularHeader, generateAngularTitle, generateHttpClientImplementation, generateHttpResourceClient, generateHttpResourceExtraFiles, generateHttpResourceFooter, generateHttpResourceHeader, getAcceptHelperName, getAngularBaseUrlFilePath, getAngularBaseUrlImportSpecifier, getAngularDependencies, getAngularHttpImports, getAngularHttpResourceDependencies, getAngularHttpResourceOnlyDependencies, getAngularHttpResponseImport, getBaseUrlConstantPrefix, getBaseUrlResolverContextTypeName, getBaseUrlResolverTokenName, getBaseUrlResolverTypeName, getBaseUrlServerUrlConstantName, getBaseUrlTokenName, getDefaultSuccessType, getHttpClientReturnTypes, getProvideBaseUrlName, getProvideBaseUrlResolverName, getRelevantVerbOptionsForTag, getSchemaOutputTypeRef, getUniqueContentTypes, isDefined, isMutationVerb, isPrimitiveType, isRetrievalVerb, isZodSchemaOutput, narrowsResponseEvents, resetHttpClientReturnTypes, routeRegistry };
//# sourceMappingURL=index.d.mts.map