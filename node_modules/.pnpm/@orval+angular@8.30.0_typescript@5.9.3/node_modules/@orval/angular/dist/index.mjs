import { EnumGeneration, GetterPropType, OutputMode, buildAngularParamsFilterExpression, dedupeSchemaImports, emitResponseValidation, escapeRegExp, generateBodyOptions, generateDependencyImports, generateFormDataAndUrlEncodedFunction, generateMutatorConfig, generateMutatorImports, generateMutatorRequestOptions, generateOptions, generateVerbImports, getAngularFilteredParamsHelperBody, getAngularObjectParamStrategies, getDefaultContentType, getEnumImplementation, getFileInfo, getFullRoute, getImportExtension, getIsBodyVerb, getOperationTagKey, getSchemasImportPath, getTagKey, isBoolean, isObject, isOperationInTagBucket, isSyntheticDefaultImportsAllow, jsDoc, jsStringLiteralEscape, makeRouteSafe, pascal, resolveSchemaImportDependencies, resolveServerUrl, sanitize, snake, toObjectString, upath } from "@orval/core";
//#region src/base-url.ts
/**
* Reads the file-level JSDoc header configured via `output.override.header`.
*
* Mirrors the identically-named helper in `http-resource.ts` — duplicated
* (rather than imported) to keep this module free of a dependency on the
* httpResource generator.
*/
const getHeader$1 = (option, info) => {
	if (!option || !info) return "";
	const header = option(info);
	return Array.isArray(header) ? jsDoc({ description: header }) : header;
};
/** `example-api` -> `EXAMPLE_API` — the shared constant-case prefix for every generated identifier. */
const getBaseUrlConstantPrefix = (apiId) => snake(apiId).toUpperCase();
/** `example-api` -> `EXAMPLE_API_SERVER_URL` */
const getBaseUrlServerUrlConstantName = (apiId) => `${getBaseUrlConstantPrefix(apiId)}_SERVER_URL`;
/** `example-api` -> `EXAMPLE_API_BASE_URL` */
const getBaseUrlTokenName = (apiId) => `${getBaseUrlConstantPrefix(apiId)}_BASE_URL`;
/** `example-api` -> `EXAMPLE_API_BASE_URL_RESOLVER` */
const getBaseUrlResolverTokenName = (apiId) => `${getBaseUrlConstantPrefix(apiId)}_BASE_URL_RESOLVER`;
/** `example-api` -> `ExampleApiBaseUrlResolver` (resolver function type name) */
const getBaseUrlResolverTypeName = (apiId) => `${pascal(apiId)}BaseUrlResolver`;
/** `example-api` -> `ExampleApiBaseUrlResolverContext` (resolver context type name) */
const getBaseUrlResolverContextTypeName = (apiId) => `${pascal(apiId)}BaseUrlResolverContext`;
/** `example-api` -> `provideExampleApiBaseUrl` */
const getProvideBaseUrlName = (apiId) => `provide${pascal(apiId)}BaseUrl`;
/** `example-api` -> `provideExampleApiBaseUrlResolver` */
const getProvideBaseUrlResolverName = (apiId) => `provide${pascal(apiId)}BaseUrlResolver`;
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
const buildAngularBaseUrlFileContent = ({ apiId, serverUrl }) => {
	const serverUrlConstantName = getBaseUrlServerUrlConstantName(apiId);
	const tokenName = getBaseUrlTokenName(apiId);
	const resolverTokenName = getBaseUrlResolverTokenName(apiId);
	const resolverTypeName = getBaseUrlResolverTypeName(apiId);
	const contextTypeName = getBaseUrlResolverContextTypeName(apiId);
	const provideBaseUrlName = getProvideBaseUrlName(apiId);
	const provideBaseUrlResolverName = getProvideBaseUrlResolverName(apiId);
	return `import { InjectionToken, inject, type Provider } from '@angular/core';

/**
 * Embedded fallback base URL for the \`${apiId}\` API, resolved at generation
 * time from the OpenAPI specification's \`servers\` field (\`''\` when the
 * specification has no servers).
 */
export const ${serverUrlConstantName}: string = ${JSON.stringify(serverUrl)};

/**
 * Strips trailing slashes from a base URL.
 *
 * Generated routes always start with \`/\`, so normalizing here at the token
 * boundary guarantees \`\${baseUrl}\${route}\` can never double or drop the
 * separator between them, for either \`HttpClient\` services or \`httpResource\`
 * functions.
 */
export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\\/+$/, '');
}

/** Context passed to a \`${resolverTypeName}\` when it is invoked. */
export interface ${contextTypeName} {
  /** The explicit \`apiId\` configured via \`override.angular.baseUrl\`. */
  readonly apiId: ${JSON.stringify(apiId)};
  /** The embedded fallback server URL (\`${serverUrlConstantName}\`). */
  readonly serverUrl: string;
}

/** Resolves the runtime base URL for the \`${apiId}\` API. */
export type ${resolverTypeName} = (context: ${contextTypeName}) => string;

/**
 * Injectable hook for resolving the \`${apiId}\` API's base URL at runtime
 * (e.g. from a gateway route registry). Overridden via
 * \`${provideBaseUrlResolverName}\`; defaults to the embedded specification
 * server URL.
 */
export const ${resolverTokenName} = new InjectionToken<${resolverTypeName}>(
  ${JSON.stringify(resolverTokenName)},
  {
    providedIn: 'root',
    factory: (): ${resolverTypeName} => (context) => context.serverUrl,
  },
);

/**
 * Runtime base URL for the \`${apiId}\` API, composed via Angular DI.
 *
 * Precedence: a directly provided value (\`${provideBaseUrlName}\`) wins
 * outright; otherwise the \`${resolverTokenName}\` resolver (default or
 * provided via \`${provideBaseUrlResolverName}\`) is invoked with the embedded
 * \`${serverUrlConstantName}\` fallback. The result is always normalized.
 */
export const ${tokenName} = new InjectionToken<string>(${JSON.stringify(tokenName)}, {
  providedIn: 'root',
  factory: (): string => {
    const resolver = inject(${resolverTokenName});
    return normalizeBaseUrl(
      resolver({ apiId: ${JSON.stringify(apiId)}, serverUrl: ${serverUrlConstantName} }),
    );
  },
});

/** Directly provides the \`${apiId}\` API's base URL, bypassing the resolver. */
export function ${provideBaseUrlName}(baseUrl: string): Provider {
  return { provide: ${tokenName}, useValue: normalizeBaseUrl(baseUrl) };
}

/** Provides a custom resolver for the \`${apiId}\` API's base URL. */
export function ${provideBaseUrlResolverName}(
  resolver: ${resolverTypeName},
): Provider {
  return { provide: ${resolverTokenName}, useValue: resolver };
}
`;
};
/**
* Path of the generated `<target>.base-url.ts` file for the current output.
*
* Unlike the `httpResource` extra-file mechanism (one sibling file per tag in
* `tags` / `tags-split` mode), there is exactly one base-URL file per output —
* the DI tokens it exports are shared by every generated file regardless of mode.
*/
const getAngularBaseUrlFilePath = (output) => {
	const { dirname, filename, extension } = getFileInfo(output.target, { extension: output.fileExtension });
	return upath.joinSafe(dirname, `${filename}.base-url${extension}`);
};
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
const getAngularBaseUrlImportSpecifier = (output) => {
	const { filename, extension } = getFileInfo(output.target, { extension: output.fileExtension });
	return `./${filename}.base-url${getImportExtension(extension, output.tsconfig)}`;
};
const buildBaseUrlExtraFile = (baseUrl, output, context, header) => {
	const serverUrl = resolveServerUrl(context.spec.servers, {
		index: baseUrl.index,
		variables: baseUrl.variables
	});
	return {
		path: getAngularBaseUrlFilePath(output),
		content: `${header}${buildAngularBaseUrlFileContent({
			apiId: baseUrl.apiId,
			serverUrl
		})}`
	};
};
/**
* Emits the opt-in `<target>.base-url.ts` extra file when
* `override.angular.baseUrl` is configured; a zero-cost no-op (`[]`) otherwise.
*
* @returns Zero or one `ClientFileBuilder` describing the generated base-URL file.
*/
const generateAngularBaseUrlExtraFiles = (_verbOptions, output, context) => {
	const baseUrl = output.override.angular.baseUrl;
	if (!baseUrl) return Promise.resolve([]);
	const header = getHeader$1(output.override.header, context.spec.info);
	return Promise.resolve([buildBaseUrlExtraFile(baseUrl, output, context, header)]);
};
//#endregion
//#region src/constants.ts
const ANGULAR_HTTP_CLIENT_DEPENDENCIES = [
	{
		exports: [
			{
				name: "HttpClient",
				values: true
			},
			{ name: "HttpParams" },
			{ name: "HttpContext" },
			{ name: "HttpEvent" }
		],
		dependency: "@angular/common/http"
	},
	{
		exports: [{
			name: "Injectable",
			values: true
		}, {
			name: "inject",
			values: true
		}],
		dependency: "@angular/core"
	},
	{
		exports: [{ name: "Observable" }],
		dependency: "rxjs"
	}
];
const ANGULAR_HTTP_RESOURCE_DEPENDENCIES = [{
	exports: [
		{
			name: "httpResource",
			values: true
		},
		{ name: "HttpResourceOptions" },
		{ name: "HttpResourceRef" },
		{ name: "HttpResourceRequest" },
		{
			name: "HttpHeaders",
			values: true
		},
		{ name: "HttpParams" },
		{ name: "HttpContext" }
	],
	dependency: "@angular/common/http"
}, {
	exports: [
		{ name: "Signal" },
		{ name: "ResourceStatus" },
		{
			name: "inject",
			values: true
		}
	],
	dependency: "@angular/core"
}];
//#endregion
//#region src/types.ts
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
const HTTP_CLIENT_OPTIONS_TEMPLATE = `interface HttpClientOptions {
  readonly headers?: HttpHeaders | Record<string, string | string[]>;
  readonly context?: HttpContext;
  readonly params?:
        | HttpParams
      | Record<string, string | number | boolean | Array<string | number | boolean>>;
  readonly reportProgress?: boolean;
  readonly withCredentials?: boolean;
  readonly credentials?: RequestCredentials;
  readonly keepalive?: boolean;
  readonly priority?: RequestPriority;
  readonly cache?: RequestCache;
  readonly mode?: RequestMode;
  readonly redirect?: RequestRedirect;
  readonly referrer?: string;
  readonly integrity?: string;
  readonly referrerPolicy?: ReferrerPolicy;
  readonly transferCache?: {includeHeaders?: string[]} | boolean;
  readonly timeout?: number;
}`;
/**
* Code templates for reusable observe option helpers emitted into generated files.
*/
const HTTP_CLIENT_OBSERVE_OPTIONS_TEMPLATE = `type HttpClientBodyOptions = HttpClientOptions & {
  readonly observe?: 'body';
};

type HttpClientEventOptions = HttpClientOptions & {
  readonly observe: 'events';
};

type HttpClientResponseOptions = HttpClientOptions & {
  readonly observe: 'response';
};

type HttpClientObserveOptions = HttpClientOptions & {
  readonly observe?: 'body' | 'events' | 'response';
};`;
/**
* Code template for the `ThirdParameter` utility type used with custom mutators.
*/
const THIRD_PARAMETER_TEMPLATE = `// eslint-disable-next-line
    type ThirdParameter<T extends (...args: never[]) => unknown> = T extends (
  config: unknown,
  httpClient: unknown,
  args: infer P,
) => unknown
  ? P
  : never;`;
const PRIMITIVE_TYPES = /* @__PURE__ */ new Set([
	"string",
	"number",
	"boolean",
	"void",
	"unknown"
]);
const PRIMITIVE_TYPE_LOOKUP = {
	string: true,
	number: true,
	boolean: true,
	void: true,
	unknown: true
};
/**
* Narrows a schema type string to the primitive set supported by the Angular
* generators' query/header helpers.
*/
const isPrimitiveType = (t) => t != void 0 && Object.prototype.hasOwnProperty.call(PRIMITIVE_TYPE_LOOKUP, t);
/**
* Indicates whether the configured schema output target is Zod-based.
*/
const isZodSchemaOutput = (output) => isObject(output.schemas) && output.schemas.type === "zod";
/**
* Removes `null` and `undefined` from a value in a type-safe way.
*/
const isDefined = (v) => v != void 0;
/**
* Maps a schema type name to its Zod output-type reference (`${typeName}Output`).
*/
const getSchemaOutputTypeRef = (typeName) => `${typeName}Output`;
/**
* Converts an operation/tag title into the generated Angular service class name.
*/
const generateAngularTitle = (title) => {
	const sanTitle = sanitize(title);
	return `${pascal(sanTitle)}Service`;
};
/**
* Builds the opening of an @Injectable Angular service class.
* Shared between httpClient-only mode and the mutation section of httpResource mode.
*/
const buildServiceClassOpen = ({ title, isRequestOptions, isMutator, isGlobalMutator, provideIn, hasQueryParams, baseUrlFieldInitializer, hasObjectParams = false }) => {
	const provideInValue = provideIn ? `{ providedIn: '${isBoolean(provideIn) ? "root" : provideIn}' }` : "";
	return `
${isRequestOptions && !isGlobalMutator ? `${HTTP_CLIENT_OPTIONS_TEMPLATE}

${HTTP_CLIENT_OBSERVE_OPTIONS_TEMPLATE}

${hasQueryParams ? getAngularFilteredParamsHelperBody({ hasObjectParams }) : ""}` : ""}

${isRequestOptions && isMutator ? THIRD_PARAMETER_TEMPLATE : ""}

@Injectable(${provideInValue})
export class ${title} {
  private readonly http = inject(HttpClient);
${baseUrlFieldInitializer ? `  ${baseUrlFieldInitializer}\n` : ""}`;
};
/**
* Registry that maps operationName → full route (with baseUrl).
*
* Populated during client builder calls (which receive the full route via
* GeneratorOptions.route) and read during header/footer builder calls
* (which only receive verbOptions without routes).
*
* This avoids monkey-patching verbOptions with a non-standard `fullRoute` property.
*/
const createRouteRegistry = () => {
	const routes = /* @__PURE__ */ new Map();
	return {
		reset() {
			routes.clear();
		},
		set(operationName, route) {
			routes.set(operationName, route);
		},
		get(operationName, fallback) {
			return routes.get(operationName) ?? fallback;
		}
	};
};
/**
* Returns only the operations that belong to the current tag output.
*
* Tag matching is delegated to {@link isOperationInTagBucket}, the single source
* of truth for tag-bucket identity. Untagged operations resolve to the implicit
* `default` bucket, matching how the core writer routes them in
* `tags` / `tags-split` mode.
*/
const getRelevantVerbOptionsForTag = (verbOptions, tag) => {
	const allVerbOptions = Object.values(verbOptions);
	if (tag == null) return allVerbOptions;
	return allVerbOptions.filter((verbOption) => isOperationInTagBucket(verbOption, tag));
};
const createReturnTypesRegistry = () => {
	const returnTypesToWrite = /* @__PURE__ */ new Map();
	return {
		reset() {
			returnTypesToWrite.clear();
		},
		set(operationName, typeDefinition) {
			returnTypesToWrite.set(operationName, typeDefinition);
		},
		getFooter(operationNames) {
			const collected = [];
			for (const operationName of operationNames) {
				const value = returnTypesToWrite.get(operationName);
				if (value) collected.push(value);
			}
			return collected.join("\n");
		}
	};
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
function isRetrievalVerb(verb, operationName, clientOverride) {
	if (clientOverride === "httpResource") return true;
	if (clientOverride === "httpClient") return false;
	if (verb === "get" || verb === "query") return true;
	if (verb === "post" && operationName) {
		const lower = operationName.toLowerCase();
		return /^(search|list|find|query|get|fetch|lookup|filter)/.test(lower);
	}
	return false;
}
function isMutationVerb(verb, operationName, clientOverride) {
	return !isRetrievalVerb(verb, operationName, clientOverride);
}
/**
* Selects the preferred success payload type for Angular `httpResource`
* generation, favouring JSON responses and otherwise falling back to the
* generator's default content-type rules.
*/
function getDefaultSuccessType(successTypes, fallback) {
	const uniqueContentTypes = [...new Set(successTypes.map((t) => t.contentType).filter(Boolean))];
	const defaultContentType = uniqueContentTypes.find((contentType) => contentType.includes("json")) ?? (uniqueContentTypes.length > 1 ? getDefaultContentType(uniqueContentTypes) : uniqueContentTypes[0] ?? "application/json");
	return {
		contentType: defaultContentType,
		value: successTypes.find((t) => t.contentType === defaultContentType)?.value ?? fallback
	};
}
//#endregion
//#region src/http-client.ts
const returnTypesRegistry = createReturnTypesRegistry();
const hasSchemaImport = (imports, typeName) => typeName != void 0 && imports.some((imp) => imp.name === typeName);
const getSchemaValueRef = (typeName) => typeName === "Error" ? "ErrorSchema" : typeName;
/**
* Partition props into the three buckets used by per-content-type overload
* rendering: required non-body params, body params, and optional non-body
* params. The body always sits between the required and optional non-body
* params so that the per-content-type overloads can insert a required
* `accept` literal immediately after the body without violating TS1016
* (required parameter cannot follow an optional one).
*/
const partitionPropsForMultiContent = (props) => {
	const requiredNonBody = [];
	const body = [];
	const optionalNonBody = [];
	for (const p of props) if (p.type === GetterPropType.BODY) body.push(p);
	else if (p.required && !p.default) requiredNonBody.push(p);
	else optionalNonBody.push(p);
	return {
		requiredNonBody,
		body,
		optionalNonBody
	};
};
const getContentTypeReturnType$1 = (contentType, value) => {
	if (!contentType) return value;
	if (contentType.includes("json") || contentType.includes("+json")) return value;
	if (contentType.startsWith("text/") || contentType.includes("xml")) return "string";
	return "Blob";
};
/**
* Returns the dependency list required by the Angular `HttpClient` generator.
*
* These imports are consumed by Orval's generic dependency-import emitter when
* composing the generated Angular client file.
*
* @returns The Angular `HttpClient` dependency descriptors used during import generation.
*/
const getAngularDependencies = () => [...ANGULAR_HTTP_CLIENT_DEPENDENCIES];
/**
* Builds the generated TypeScript helper name used for multi-content-type
* `Accept` header unions.
*
* Example: `listPets` -> `ListPetsAccept`.
*
* @returns A PascalCase helper type/const name for the operation's `Accept` values.
*/
const getAcceptHelperName = (typeName) => `${pascal(typeName)}Accept`;
/**
* Collects the distinct successful response content types for a single
* operation.
*
* The Angular generators use this to decide whether they need `Accept`
* overloads or content-type-specific branching logic.
*
* @returns A de-duplicated list of response content types, excluding empty entries.
*/
const getUniqueContentTypes = (successTypes) => [...new Set(successTypes.map((t) => t.contentType).filter(Boolean))];
const toAcceptHelperKey = (contentType) => contentType.replaceAll(/[^A-Za-z0-9]+/g, "_").replaceAll(/^_+|_+$/g, "").toLowerCase();
const buildAcceptHelper = (typeName, contentTypes, output) => {
	const acceptHelperName = getAcceptHelperName(typeName);
	const enumMembers = contentTypes.map((contentType) => ({
		value: contentType,
		name: toAcceptHelperKey(contentType)
	}));
	return `export type ${acceptHelperName} = typeof ${acceptHelperName}[keyof typeof ${acceptHelperName}];
  
export const ${acceptHelperName} = {
${getEnumImplementation(enumMembers, {
		enumNamingConvention: output.override.namingConvention.enum,
		enumGenerationType: EnumGeneration.CONST
	})}} as const;`;
};
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
const buildAcceptHelpers = (verbOptions, output) => verbOptions.flatMap((verbOption) => {
	const contentTypes = getUniqueContentTypes(verbOption.response.types.success);
	if (contentTypes.length <= 1) return [];
	return [buildAcceptHelper(verbOption.typeName, contentTypes, output)];
}).join("\n\n");
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
const generateAngularHeader = ({ title, isRequestOptions, isMutator, isGlobalMutator, provideIn, verbOptions, tag, output }) => {
	returnTypesRegistry.reset();
	const relevantVerbs = getRelevantVerbOptionsForTag(verbOptions, tag);
	const hasBuiltInFilteredQueryParams = relevantVerbs.some((v) => v.queryParams && !v.paramsFilter);
	const hasObjectParams = relevantVerbs.some((v) => Object.keys(getAngularObjectParamStrategies({
		queryParams: v.queryParams,
		paramsSerializer: v.paramsSerializer,
		paramsFilter: v.paramsFilter,
		queryObjectSerialization: v.override.angular.queryObjectSerialization
	})).length > 0);
	const acceptHelpers = buildAcceptHelpers(relevantVerbs, output);
	return `
${isRequestOptions && !isGlobalMutator ? `${HTTP_CLIENT_OPTIONS_TEMPLATE}

${HTTP_CLIENT_OBSERVE_OPTIONS_TEMPLATE}

${hasBuiltInFilteredQueryParams ? getAngularFilteredParamsHelperBody({ hasObjectParams }) : ""}` : ""}

${isRequestOptions && isMutator ? THIRD_PARAMETER_TEMPLATE : ""}

${acceptHelpers}

@Injectable(${provideIn ? `{ providedIn: '${isBoolean(provideIn) ? "root" : provideIn}' }` : ""})
export class ${title} {
  private readonly http = inject(HttpClient);
${output.override.angular.baseUrl ? `  private readonly baseUrl = inject(${getBaseUrlTokenName(output.override.angular.baseUrl.apiId)});
` : ""}`;
};
/**
* Generates the closing section for Angular `HttpClient` output.
*
* @remarks
* Besides closing the generated service class, this appends any collected
* `ClientResult` aliases registered while individual operations were emitted.
*
* @returns The footer text for the generated Angular client file.
*/
const generateAngularFooter = ({ operationNames }) => {
	let footer = "};\n\n";
	const returnTypes = returnTypesRegistry.getFooter(operationNames);
	if (returnTypes) footer += `${returnTypes}\n`;
	return footer;
};
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
const generateHttpClientImplementation = ({ headers, queryParams, operationName, typeName, response, mutator, body, props, verb, override, formData, formUrlEncoded, paramsSerializer, paramsFilter, params }, { route: _route, context }) => {
	let route = _route;
	if (context.output.urlEncodeParameters) {
		const skip = new Set(params.filter((p) => p.allowReserved).map((p) => p.name));
		route = makeRouteSafe(route, skip);
	}
	if (context.output.override.angular.baseUrl) route = "${this.baseUrl}" + route;
	const isRequestOptions = override.requestOptions !== false;
	const isFormData = !override.formData.disabled;
	const isFormUrlEncoded = override.formUrlEncoded !== false;
	const isExactOptionalPropertyTypes = !!context.output.tsconfig?.compilerOptions?.exactOptionalPropertyTypes;
	const bodyForm = generateFormDataAndUrlEncodedFunction({
		formData,
		formUrlEncoded,
		body,
		isFormData,
		isFormUrlEncoded
	});
	const dataType = response.definition.success || "unknown";
	const isPrimitive = isPrimitiveType(dataType);
	const hasSchema = hasSchemaImport(response.imports, dataType);
	const isZodOutput = isZodSchemaOutput(context.output);
	const shouldValidateResponse = override.angular.runtimeValidation.enabled && isZodOutput && !isPrimitive && hasSchema;
	const parsedDataType = shouldValidateResponse ? getSchemaOutputTypeRef(dataType) : dataType;
	const getGeneratedResponseType = (value, contentType) => {
		if (override.angular.runtimeValidation.enabled && isZodOutput && !!contentType && (contentType.includes("json") || contentType.includes("+json")) && !isPrimitiveType(value) && hasSchemaImport(response.imports, value)) return getSchemaOutputTypeRef(value);
		return getContentTypeReturnType$1(contentType, value);
	};
	const resultAliasType = mutator ? dataType : response.types.success.length <= 1 ? parsedDataType : [...new Set(response.types.success.map(({ value, contentType }) => getGeneratedResponseType(value, contentType)))].join(" | ") || parsedDataType;
	const schemaValueRef = shouldValidateResponse ? getSchemaValueRef(dataType) : dataType;
	const validationStrategy = override.angular.runtimeValidation.strategy;
	const validationPipe = shouldValidateResponse ? emitResponseValidation({
		schemaRef: schemaValueRef,
		operationName,
		strategy: validationStrategy,
		context: "rxjs-map"
	}) : "";
	const responseValidationPipe = shouldValidateResponse ? `.pipe(map(response => response.clone({ body: ${emitResponseValidation({
		schemaRef: schemaValueRef,
		operationName,
		strategy: validationStrategy,
		context: "clone-expression",
		inputExpression: "response.body"
	})} })))` : "";
	const eventValidationPipe = shouldValidateResponse ? `.pipe(map(event => event instanceof AngularHttpResponse ? event.clone({ body: ${emitResponseValidation({
		schemaRef: schemaValueRef,
		operationName,
		strategy: validationStrategy,
		context: "clone-expression",
		inputExpression: "event.body"
	})} }) : event))` : "";
	returnTypesRegistry.set(operationName, `export type ${pascal(typeName)}ClientResult = NonNullable<${resultAliasType}>`);
	if (mutator) {
		const mutatorConfig = generateMutatorConfig({
			route,
			body,
			headers,
			queryParams,
			response,
			verb,
			isFormData,
			isFormUrlEncoded,
			hasSignal: false,
			isExactOptionalPropertyTypes,
			isAngular: true,
			paramsFilter
		});
		const requestOptions = isRequestOptions ? generateMutatorRequestOptions(override.requestOptions, mutator.hasThirdArg) : "";
		return ` ${operationName}<TData = ${dataType}>(\n    ${mutator.bodyTypeName && body.definition ? toObjectString(props, "implementation").replace(new RegExp(String.raw`(\\w*):\\s?${body.definition}`), `$1: ${mutator.bodyTypeName}<${body.definition}>`) : toObjectString(props, "implementation")}\n ${isRequestOptions && mutator.hasThirdArg ? `options?: ThirdParameter<typeof ${mutator.name}>` : ""}) {${bodyForm}
      return ${mutator.name}<TData>(
      ${mutatorConfig},
      this.http,
      ${requestOptions});
    }
  `;
	}
	const objectParamStrategies = getAngularObjectParamStrategies({
		queryParams,
		paramsSerializer,
		paramsFilter,
		queryObjectSerialization: override.angular.queryObjectSerialization
	});
	const optionsBase = {
		route,
		body,
		headers,
		queryParams,
		objectQueryParamStrategies: objectParamStrategies,
		response,
		verb,
		requestOptions: override.requestOptions,
		isFormData,
		isFormUrlEncoded,
		paramsSerializer,
		paramsSerializerOptions: override.paramsSerializerOptions,
		paramsFilter,
		isAngular: true,
		isExactOptionalPropertyTypes,
		hasSignal: false
	};
	const propsDefinition = toObjectString(props, "definition");
	const successTypes = response.types.success;
	const uniqueContentTypes = getUniqueContentTypes(successTypes);
	const hasMultipleContentTypes = uniqueContentTypes.length > 1;
	const acceptTypeName = hasMultipleContentTypes ? getAcceptHelperName(typeName) : void 0;
	const needsObserveBranching = isRequestOptions && !hasMultipleContentTypes;
	const angularParamsRef = queryParams ? "filteredParams" : void 0;
	let paramsDeclaration = "";
	if (angularParamsRef && queryParams) {
		const filterExpr = buildAngularParamsFilterExpression({
			paramsExpression: isRequestOptions ? "{...params, ...options?.params}" : "params ?? {}",
			requiredNullableParamKeys: queryParams.requiredNullableKeys ?? [],
			preserveRequiredNullables: !!paramsSerializer,
			nonPrimitiveKeys: paramsSerializer ? queryParams.nonPrimitiveKeys ?? [] : [],
			objectParamStrategies,
			paramsFilter,
			useSharedHelper: isRequestOptions
		});
		paramsDeclaration = paramsSerializer ? `const ${angularParamsRef} = ${paramsSerializer.name}(${filterExpr});\n\n    ` : `const ${angularParamsRef} = ${filterExpr};\n\n    `;
	}
	const optionsInput = {
		...optionsBase,
		...angularParamsRef ? { angularParamsRef } : {}
	};
	const options = generateOptions(optionsInput);
	const defaultContentType = hasMultipleContentTypes ? successTypes.find(({ contentType }) => !!contentType && (contentType.includes("json") || contentType.includes("+json")))?.contentType ?? getDefaultContentType(uniqueContentTypes) : uniqueContentTypes[0] ?? "application/json";
	const jsonSuccessValues = [...new Set(successTypes.filter(({ contentType }) => !!contentType && (contentType.includes("json") || contentType.includes("+json"))).map(({ value }) => value))];
	const jsonReturnType = jsonSuccessValues.length > 0 ? jsonSuccessValues.join(" | ") : "unknown";
	const parsedJsonReturnType = jsonSuccessValues.length === 1 && override.angular.runtimeValidation.enabled && isZodOutput && !isPrimitiveType(jsonSuccessValues[0]) && hasSchemaImport(response.imports, jsonSuccessValues[0]) ? getSchemaOutputTypeRef(jsonSuccessValues[0]) : jsonReturnType;
	let jsonValidationPipe = shouldValidateResponse ? emitResponseValidation({
		schemaRef: schemaValueRef,
		operationName,
		strategy: validationStrategy,
		context: "rxjs-map"
	}) : "";
	if (hasMultipleContentTypes && !shouldValidateResponse && override.angular.runtimeValidation.enabled && isZodOutput && jsonSuccessValues.length === 1) {
		const jsonType = jsonSuccessValues[0];
		const jsonIsPrimitive = isPrimitiveType(jsonType);
		const jsonHasSchema = hasSchemaImport(response.imports, jsonType);
		if (!jsonIsPrimitive && jsonHasSchema) {
			const jsonSchemaRef = getSchemaValueRef(jsonType);
			jsonValidationPipe = emitResponseValidation({
				schemaRef: jsonSchemaRef,
				operationName,
				strategy: validationStrategy,
				context: "rxjs-map"
			});
		}
	}
	const textSuccessTypes = successTypes.filter(({ contentType, value }) => !!contentType && (contentType.startsWith("text/") || contentType.includes("xml") || value === "string"));
	const blobSuccessTypes = successTypes.filter(({ contentType }) => !!contentType && !contentType.includes("json") && !contentType.includes("+json") && !contentType.startsWith("text/") && !contentType.includes("xml"));
	const multiReturnMembers = [
		parsedJsonReturnType,
		...textSuccessTypes.length > 0 ? ["string"] : [],
		...blobSuccessTypes.length > 0 ? ["Blob"] : []
	];
	const refinedMultiImplementationReturnType = `Observable<${[...new Set(multiReturnMembers)].join(" | ")}>`;
	const observeOptions = needsObserveBranching ? {
		body: generateOptions({
			...optionsInput,
			angularObserve: "body"
		}),
		events: generateOptions({
			...optionsInput,
			angularObserve: "events"
		}),
		response: generateOptions({
			...optionsInput,
			angularObserve: "response"
		})
	} : void 0;
	const hasTDataGeneric = dataType !== "Blob" && dataType !== "string" && dataType !== "ArrayBuffer" && !hasMultipleContentTypes && !shouldValidateResponse;
	let functionName = operationName;
	if (hasTDataGeneric) functionName += `<TData = ${parsedDataType}>`;
	let contentTypeOverloads = "";
	if (hasMultipleContentTypes && isRequestOptions) {
		const { requiredNonBody: requiredNonBodyProps, body: bodyProps, optionalNonBody: optionalNonBodyProps } = partitionPropsForMultiContent(props);
		const requiredNonBodyPart = requiredNonBodyProps.map((p) => p.definition).join(",\n    ");
		const bodyPart = bodyProps.map((p) => p.definition).join(",\n    ");
		const bodyOverloadPart = bodyProps.map((p) => {
			const optionalMarker = `${p.name}?:`;
			if (!p.required && p.definition.startsWith(optionalMarker)) {
				const required = `${p.name}:${p.definition.slice(optionalMarker.length)}`;
				return /\bundefined\b/.test(required) ? required : `${required} | undefined`;
			}
			return p.definition;
		}).join(",\n    ");
		const optionalNonBodyPart = optionalNonBodyProps.map((p) => p.definition).join(",\n    ");
		contentTypeOverloads = `${successTypes.filter(({ contentType }) => !!contentType).map(({ contentType, value }) => {
			const returnType = getGeneratedResponseType(value, contentType);
			return `${operationName}(${[
				requiredNonBodyPart,
				bodyOverloadPart,
				`accept: '${jsStringLiteralEscape(contentType ?? "")}'`,
				optionalNonBodyPart
			].filter(Boolean).join(",\n    ")}, options?: HttpClientOptions): Observable<${returnType}>;`;
		}).join("\n  ")}\n  ${operationName}(${[
			requiredNonBodyPart,
			bodyPart,
			`accept?: ${acceptTypeName ?? "string"}`,
			optionalNonBodyPart
		].filter(Boolean).join(",\n    ")}, options?: HttpClientOptions): ${refinedMultiImplementationReturnType};`;
	}
	const observeOverloads = isRequestOptions && !hasMultipleContentTypes ? `${functionName}(${propsDefinition} options?: HttpClientBodyOptions): Observable<${hasTDataGeneric ? "TData" : parsedDataType}>;\n ${functionName}(${propsDefinition} options?: HttpClientEventOptions): Observable<HttpEvent<${hasTDataGeneric ? "TData" : parsedDataType}>>;\n ${functionName}(${propsDefinition} options?: HttpClientResponseOptions): Observable<AngularHttpResponse<${hasTDataGeneric ? "TData" : parsedDataType}>>;` : "";
	const overloads = contentTypeOverloads || observeOverloads;
	const observableDataType = hasTDataGeneric ? "TData" : parsedDataType;
	const singleImplementationReturnType = isRequestOptions ? `Observable<${observableDataType} | HttpEvent<${observableDataType}> | AngularHttpResponse<${observableDataType}>>` : `Observable<${observableDataType}>`;
	if (hasMultipleContentTypes) {
		const bodyIdentifier = generateBodyOptions(body, isFormData, isFormUrlEncoded);
		const deleteBodyOption = verb === "delete" && bodyIdentifier ? `body: ${bodyIdentifier}` : "";
		const buildOptionsObject = (responseType) => `{
        ...options,
        responseType: '${responseType}',
        headers,
        ${angularParamsRef ? `params: ${angularParamsRef},` : ""}
        ${deleteBodyOption ? `${deleteBodyOption},` : ""}
      }`;
		const buildHttpClientCall = (typeArg, optionsObject) => getIsBodyVerb(verb) && verb !== "delete" ? `this.http.${verb}${typeArg}(\`${route}\`, ${bodyIdentifier ?? "undefined"}, ${optionsObject})` : `this.http.${verb}${typeArg}(\`${route}\`, ${optionsObject})`;
		const { requiredNonBody: requiredNonBodyImplProps, body: bodyImplProps, optionalNonBody: optionalNonBodyImplProps } = partitionPropsForMultiContent(props);
		const requiredNonBodyImplPart = requiredNonBodyImplProps.map((p) => p.implementation).join(",\n    ");
		const bodyImplPart = bodyImplProps.map((p) => p.implementation).join(",\n    ");
		const optionalNonBodyImplPart = optionalNonBodyImplProps.map((p) => p.implementation).join(",\n    ");
		return ` ${overloads}
  ${operationName}(
    ${[
			requiredNonBodyImplPart,
			bodyImplPart,
			`accept: ${acceptTypeName ?? "string"} = '${jsStringLiteralEscape(defaultContentType)}'`,
			optionalNonBodyImplPart
		].filter(Boolean).join(",\n    ")},
    ${isRequestOptions ? "options?: HttpClientOptions" : ""}
  ): ${refinedMultiImplementationReturnType} {${bodyForm}
    ${paramsDeclaration}const headers = options?.headers instanceof HttpHeaders
      ? options.headers.set('Accept', accept)
      : { ...(options?.headers ?? {}), Accept: accept };

    if (accept.includes('json') || accept.includes('+json')) {
      return ${buildHttpClientCall(`<${parsedJsonReturnType}>`, buildOptionsObject("json"))}${jsonValidationPipe};
    }${textSuccessTypes.length > 0 ? ` else if (accept.startsWith('text/') || accept.includes('xml')) {
      return ${buildHttpClientCall("", buildOptionsObject("text"))} as Observable<string>;
    }` : ""}${blobSuccessTypes.length > 0 ? ` else {
      return ${buildHttpClientCall("", buildOptionsObject("blob"))} as Observable<Blob>;
    }` : `

    return ${buildHttpClientCall(`<${parsedJsonReturnType}>`, buildOptionsObject("json"))}${jsonValidationPipe};`}
  }
`;
	}
	const hasInjectedResponseType = (optionsArgument) => typeof optionsArgument === "string" && /\bresponseType:\s*['"]/.test(optionsArgument);
	const httpCallExpr = (optionsArgument, observeKind) => {
		if (hasInjectedResponseType(optionsArgument)) return `this.http.${verb}(${optionsArgument}) as Observable<${observeKind === "events" ? `HttpEvent<${observableDataType}>` : observeKind === "response" ? `AngularHttpResponse<${observableDataType}>` : observableDataType}>`;
		return `this.http.${verb}<${observableDataType}>(${optionsArgument})`;
	};
	const observeImplementation = isRequestOptions ? `${paramsDeclaration}if (options?.observe === 'events') {
      return ${httpCallExpr(observeOptions?.events ?? options, "events")}${eventValidationPipe};
    }

    if (options?.observe === 'response') {
      return ${httpCallExpr(observeOptions?.response ?? options, "response")}${responseValidationPipe};
    }

    return ${httpCallExpr(observeOptions?.body ?? options, "body")}${validationPipe};` : `return ${httpCallExpr(options, "body")}${validationPipe};`;
	return ` ${overloads}
  ${functionName}(
    ${toObjectString(props, "implementation")} ${isRequestOptions ? `options?: HttpClientObserveOptions` : ""}): ${singleImplementationReturnType} {${bodyForm}
    ${observeImplementation}
  }
`;
};
const ANGULAR_HTTP_IMPORT_PATH = "@angular/common/http";
/**
* Whether the rendered HttpClient method narrows `HttpEvent`s with
* `instanceof AngularHttpResponse`. Mirrors `generateHttpClientImplementation`:
* the `observe` branches exist only with request options and a single content
* type, and the narrowing is part of the runtime-validation pipe. Lets callers
* decide the `HttpResponse` import without rendering the method, which would
* also register its `ClientResult` alias ahead of the footer.
*/
const narrowsResponseEvents = ({ response, override }, output) => {
	const dataType = response.definition.success || "unknown";
	const hasMultipleContentTypes = getUniqueContentTypes(response.types.success).length > 1;
	return override.requestOptions !== false && !hasMultipleContentTypes && override.angular.runtimeValidation.enabled && isZodSchemaOutput(output) && !isPrimitiveType(dataType) && hasSchemaImport(response.imports, dataType);
};
/**
* An `@angular/common/http` import that is a value only when `isValue`,
* otherwise type-only. A value import of a binding that is only used as a
* type fails `consistent-type-imports` in a consumer's lint setup (#3932).
*/
const angularHttpImport = (binding, isValue) => ({
	...binding,
	importPath: ANGULAR_HTTP_IMPORT_PATH,
	...isValue ? { values: true } : {}
});
/** `HttpResponse` (aliased `AngularHttpResponse`), a value only where events are narrowed. */
const getAngularHttpResponseImport = (narrowsEvents) => angularHttpImport({
	name: "HttpResponse",
	alias: "AngularHttpResponse"
}, narrowsEvents);
/**
* The `@angular/common/http` bindings whose value-or-type status depends on
* the operation: `HttpHeaders` (multi-content `Accept` dispatch narrows on it
* in the rendered body) and `HttpResponse` (see `narrowsResponseEvents`).
*/
const getAngularHttpImports = (implementation, narrowsEvents) => [angularHttpImport({ name: "HttpHeaders" }, implementation.includes("instanceof HttpHeaders")), getAngularHttpResponseImport(narrowsEvents)];
/**
* Orval client builder entry point for Angular `HttpClient` output.
*
* It normalizes imports needed for runtime validation, delegates the actual
* method implementation to `generateHttpClientImplementation`, and returns the
* generated code plus imports for the current operation.
*
* @returns The generated implementation fragment and imports for one operation.
*/
const generateAngular = (verbOptions, options) => {
	const isZodOutput = isZodSchemaOutput(options.context.output);
	const responseType = verbOptions.response.definition.success;
	const isPrimitiveResponse = isPrimitiveType(responseType);
	const shouldUseRuntimeValidation = verbOptions.override.angular.runtimeValidation.enabled && isZodOutput;
	const normalizedVerbOptions = (() => {
		if (!shouldUseRuntimeValidation) return verbOptions;
		let result = {
			...verbOptions,
			response: {
				...verbOptions.response,
				imports: verbOptions.response.imports.map((imp) => ({
					...imp,
					values: true
				}))
			}
		};
		if (!isPrimitiveResponse && hasSchemaImport(result.response.imports, responseType)) result = {
			...result,
			response: {
				...result.response,
				imports: [...result.response.imports.map((imp) => imp.name === responseType ? {
					...imp,
					values: true
				} : imp), { name: getSchemaOutputTypeRef(responseType) }]
			}
		};
		const successTypes = result.response.types.success;
		if ([...new Set(successTypes.map((t) => t.contentType).filter(Boolean))].length > 1) {
			const jsonSchemaNames = [...new Set(successTypes.filter(({ contentType }) => !!contentType && (contentType.includes("json") || contentType.includes("+json"))).map(({ value }) => value))];
			if (jsonSchemaNames.length === 1) {
				const jsonType = jsonSchemaNames[0];
				if (!isPrimitiveType(jsonType) && hasSchemaImport(result.response.imports, jsonType)) result = {
					...result,
					response: {
						...result.response,
						imports: [...result.response.imports.map((imp) => imp.name === jsonType ? {
							...imp,
							values: true
						} : imp), { name: getSchemaOutputTypeRef(jsonType) }]
					}
				};
			}
		}
		return result;
	})();
	const implementation = generateHttpClientImplementation(normalizedVerbOptions, options);
	const baseUrl = options.context.output.override.angular.baseUrl;
	return {
		implementation,
		imports: [
			...generateVerbImports(normalizedVerbOptions),
			...getAngularHttpImports(implementation, narrowsResponseEvents(normalizedVerbOptions, options.context.output)),
			...implementation.includes(".pipe(map(") ? [{
				name: "map",
				values: true,
				importPath: "rxjs"
			}] : [],
			...baseUrl ? [{
				name: getBaseUrlTokenName(baseUrl.apiId),
				values: true,
				importPath: getAngularBaseUrlImportSpecifier(options.context.output)
			}] : []
		]
	};
};
/**
* Returns the footer aliases collected for the provided operation names.
*
* The Angular generators use these aliases to expose stable `ClientResult`
* helper types such as `ListPetsClientResult`.
*
* @returns Concatenated `ClientResult` aliases for the requested operation names.
*/
const getHttpClientReturnTypes = (operationNames) => returnTypesRegistry.getFooter(operationNames);
/**
* Clears the module-level return type registry used during Angular client
* generation.
*
* This must be called at the start of each generation pass to avoid leaking
* aliases across files or tags.
*
* @returns Nothing.
*/
const resetHttpClientReturnTypes = () => {
	returnTypesRegistry.reset();
};
//#endregion
//#region src/http-resource.ts
const isAngularHttpResourceOptions = (value) => value === void 0 || isObject(value) && (value.defaultValue === void 0 || typeof value.defaultValue === "string" || typeof value.defaultValue === "number" || typeof value.defaultValue === "boolean" || value.defaultValue === null || Array.isArray(value.defaultValue) || isObject(value.defaultValue)) && (value.debugName === void 0 || typeof value.debugName === "string") && (value.injector === void 0 || typeof value.injector === "string") && (value.equal === void 0 || typeof value.equal === "string");
const isAngularOperationOverride = (value) => value !== void 0 && typeof value === "object" && value !== null && (!("client" in value) || value.client === "httpClient" || value.client === "httpResource" || value.client === "both") && (!("httpResource" in value) || isAngularHttpResourceOptions(value.httpResource));
const getClientOverride = (verbOption) => {
	const angular = verbOption.override.operations[verbOption.operationId]?.angular;
	return isAngularOperationOverride(angular) ? angular.client : void 0;
};
/**
* Resolves the effective `httpResource` option override for an operation.
*
* Operation-level configuration takes precedence over the global
* `override.angular.httpResource` block while still inheriting unspecified
* values from the global configuration.
*
* @returns The merged resource options for the operation, or `undefined` when no override exists.
*/
const getHttpResourceOverride = (verbOption, output) => {
	const operationAngular = verbOption.override.operations[verbOption.operationId]?.angular;
	const operationOverride = isAngularOperationOverride(operationAngular) ? operationAngular.httpResource : void 0;
	const angularOverride = output.override.angular;
	const globalOverride = isObject(angularOverride) && "httpResource" in angularOverride && isAngularHttpResourceOptions(angularOverride.httpResource) ? angularOverride.httpResource : void 0;
	if (globalOverride === void 0) return operationOverride;
	if (operationOverride === void 0) return globalOverride;
	return {
		...globalOverride,
		...operationOverride
	};
};
const resourceReturnTypesRegistry = createReturnTypesRegistry();
/** @internal Exported for testing only */
const routeRegistry = createRouteRegistry();
const getVerbOptionsRecord = (verbOptions) => Object.fromEntries(verbOptions.map((verbOption) => [verbOption.operationId, verbOption]));
const getPrimaryTag = (verbOption) => getOperationTagKey(verbOption);
const hasRetrievalOperations = (verbOptions) => Object.values(verbOptions).some((verbOption) => isRetrievalVerb(verbOption.verb, verbOption.operationName, getClientOverride(verbOption)));
const getHeader = (option, info) => {
	if (!option || !info) return "";
	const header = option(info);
	return Array.isArray(header) ? jsDoc({ description: header }) : header;
};
const mergeDependencies = (deps) => {
	const merged = /* @__PURE__ */ new Map();
	for (const dep of deps) {
		const existing = merged.get(dep.dependency);
		if (!existing) {
			merged.set(dep.dependency, {
				exports: [...dep.exports],
				dependency: dep.dependency
			});
			continue;
		}
		for (const exp of dep.exports) if (!existing.exports.some((current) => current.name === exp.name && current.alias === exp.alias)) existing.exports.push(exp);
	}
	return [...merged.values()];
};
const cloneDependencies = (deps) => deps.map((dep) => ({
	...dep,
	exports: [...dep.exports]
}));
/**
* Returns the merged dependency list required when Angular `httpResource`
* output coexists with Angular `HttpClient` service generation.
*
* This is used for pure `httpResource` mode as well as mixed generation paths
* that still need Angular common HTTP symbols and service helpers.
*
* @returns The de-duplicated dependency descriptors for Angular resource generation.
*/
const getAngularHttpResourceDependencies = () => mergeDependencies([...ANGULAR_HTTP_CLIENT_DEPENDENCIES, ...ANGULAR_HTTP_RESOURCE_DEPENDENCIES]);
/**
* Returns only the dependencies required by standalone generated resource
* files, such as the sibling `*.resource.ts` output used in `both` mode.
*
* @returns The dependency descriptors required by resource-only files.
*/
const getAngularHttpResourceOnlyDependencies = () => cloneDependencies(ANGULAR_HTTP_RESOURCE_DEPENDENCIES);
const isResponseText = (contentType, dataType) => {
	if (dataType === "string") return true;
	if (!contentType) return false;
	return contentType.startsWith("text/") || contentType.includes("xml");
};
const isResponseArrayBuffer = (contentType) => {
	if (!contentType) return false;
	return contentType.includes("application/octet-stream") || contentType.includes("application/pdf");
};
const isResponseBlob = (contentType, isBlob) => {
	if (isBlob) return true;
	if (!contentType) return false;
	return contentType.startsWith("image/") || contentType.includes("blob");
};
const HTTP_RESOURCE_OPTIONS_TYPE_NAME = "OrvalHttpResourceOptions";
const HTTP_RESOURCE_REQUEST_EXTENSION_TYPE_NAME = "OrvalHttpResourceRequestExtension";
const RESOURCE_STATE_TYPE_NAME = "ResourceState";
const RESOLVED_RESOURCE_STATE_TYPE_NAME = "ResolvedResourceState";
const APPLY_REQUEST_EXTENSION_FUNCTION_NAME = "applyOrvalRequestExtension";
const TO_RESOURCE_STATE_FUNCTION_NAME = "toResourceState";
/**
* Boilerplate that every generated `*.resource.ts` declares. In a tag-based
* mode each tag repeats it. The barrel writer needs the list to prevent
* TS2308. See `buildBarrelReExports`.
*
* These are the same constants that the templates interpolate, so a rename
* cannot desynchronise the two.
*/
const HTTP_RESOURCE_SHARED_EXPORTS = {
	types: [
		HTTP_RESOURCE_OPTIONS_TYPE_NAME,
		HTTP_RESOURCE_REQUEST_EXTENSION_TYPE_NAME,
		RESOURCE_STATE_TYPE_NAME,
		RESOLVED_RESOURCE_STATE_TYPE_NAME
	],
	values: [APPLY_REQUEST_EXTENSION_FUNCTION_NAME, TO_RESOURCE_STATE_FUNCTION_NAME]
};
const getHttpResourceFactory = (response, contentType, dataType) => {
	if (isResponseText(contentType, dataType)) return "httpResource.text";
	if (isResponseBlob(contentType, response.isBlob)) return "httpResource.blob";
	if (isResponseArrayBuffer(contentType)) return "httpResource.arrayBuffer";
	return "httpResource";
};
const getHttpResourceRawType = (factory) => {
	switch (factory) {
		case "httpResource.text": return "string";
		case "httpResource.arrayBuffer": return "ArrayBuffer";
		case "httpResource.blob": return "Blob";
		default: return "unknown";
	}
};
const getTypeWithoutDefault = (definition) => {
	const match = /^([^:]+):\s*(.+)$/.exec(definition);
	if (!match) return definition;
	return match[2].replace(/\s*=\s*.*$/, "").trim();
};
const getDefaultValueFromImplementation = (implementation) => {
	const match = /=\s*(.+)$/.exec(implementation);
	return match ? match[1].trim() : void 0;
};
const withSignal = (prop, options = {}) => {
	const type = getTypeWithoutDefault(prop.definition);
	const derivedDefault = getDefaultValueFromImplementation(prop.implementation) !== void 0 || typeof prop.default !== "boolean" && prop.default !== void 0;
	const hasDefault = options.hasDefault ?? derivedDefault;
	const nameMatch = /^([^:]+):/.exec(prop.definition);
	const hasOptionalMark = (nameMatch ? nameMatch[1] : prop.name).includes("?");
	const optional = prop.required && !hasDefault && !hasOptionalMark ? "" : "?";
	const definition = `${prop.name}${optional}: Signal<${type}>`;
	return {
		definition,
		implementation: definition
	};
};
const buildSignalProps = (props, params) => {
	const paramDefaults = /* @__PURE__ */ new Map();
	for (const param of params) {
		const hasDefault = getDefaultValueFromImplementation(param.implementation) !== void 0 || param.default !== void 0;
		paramDefaults.set(param.name, hasDefault);
	}
	return props.map((prop) => {
		switch (prop.type) {
			case GetterPropType.NAMED_PATH_PARAMS: return {
				...prop,
				name: "pathParams",
				definition: `pathParams: Signal<${prop.schema.name}>`,
				implementation: `pathParams: Signal<${prop.schema.name}>`
			};
			case GetterPropType.PARAM:
			case GetterPropType.QUERY_PARAM:
			case GetterPropType.BODY:
			case GetterPropType.HEADER: {
				const hasDefault = prop.type === GetterPropType.PARAM ? paramDefaults.get(prop.name) ?? false : false;
				const signalProp = withSignal(prop, { hasDefault });
				return {
					...prop,
					definition: signalProp.definition,
					implementation: signalProp.implementation
				};
			}
			default: return prop;
		}
	});
};
const applySignalRoute = (route, params, useNamedParams) => {
	let updatedRoute = route;
	for (const param of params) {
		const template = "${" + param.name + "}";
		const defaultValue = getDefaultValueFromImplementation(param.implementation);
		let replacement;
		if (useNamedParams) replacement = defaultValue === void 0 ? "${pathParams()." + param.name + "}" : "${pathParams()?." + param.name + " ?? " + defaultValue + "}";
		else replacement = defaultValue === void 0 ? "${" + param.name + "()}" : "${" + param.name + "?.() ?? " + defaultValue + "}";
		updatedRoute = updatedRoute.replaceAll(template, replacement);
	}
	return updatedRoute;
};
/**
* Whether a single operation has at least one gated object-serialization
* strategy (issue #3705) to apply. Used to decide whether the shared
* `filterParams` helper needs its object-serialization overload.
*/
const hasGatedObjectQueryParamStrategies = (verbOption) => Object.keys(getAngularObjectParamStrategies({
	queryParams: verbOption.queryParams,
	paramsSerializer: verbOption.paramsSerializer,
	paramsFilter: verbOption.paramsFilter,
	queryObjectSerialization: verbOption.override.angular.queryObjectSerialization
})).length > 0;
const buildResourceRequest = ({ verb, body, headers, queryParams, paramsSerializer, paramsFilter, override, formData, formUrlEncoded }, route, { supportsIdleGuard }) => {
	const isFormData = !override.formData.disabled;
	const isFormUrlEncoded = override.formUrlEncoded !== false;
	const bodyForm = generateFormDataAndUrlEncodedFunction({
		formData,
		formUrlEncoded,
		body,
		isFormData,
		isFormUrlEncoded
	});
	const hasFormData = isFormData && body.formData;
	const hasFormUrlEncoded = isFormUrlEncoded && body.formUrlEncoded;
	const isDirectBody = !!body.definition && !hasFormData && !hasFormUrlEncoded;
	const bodyGuard = supportsIdleGuard && isDirectBody && body.isOptional ? `if (!${body.implementation}) return undefined;` : void 0;
	const bodyAccess = body.definition ? body.isOptional && !bodyGuard ? `${body.implementation}?.()` : `${body.implementation}()` : void 0;
	const bodyValue = hasFormData ? "formData" : hasFormUrlEncoded ? "formUrlEncoded" : bodyAccess;
	const paramsAccess = queryParams ? "params?.()" : void 0;
	const headersAccess = headers ? "headers?.()" : void 0;
	const objectParamStrategies = getAngularObjectParamStrategies({
		queryParams,
		paramsSerializer,
		paramsFilter,
		queryObjectSerialization: override.angular.queryObjectSerialization
	});
	const filteredParamsValue = paramsAccess ? buildAngularParamsFilterExpression({
		paramsExpression: `${paramsAccess} ?? {}`,
		requiredNullableParamKeys: queryParams?.requiredNullableKeys ?? [],
		preserveRequiredNullables: !!paramsSerializer,
		nonPrimitiveKeys: paramsSerializer ? queryParams?.nonPrimitiveKeys ?? [] : [],
		objectParamStrategies,
		paramsFilter,
		useSharedHelper: true
	}) : void 0;
	const paramsValue = paramsAccess ? paramsSerializer ? `params?.() ? ${paramsSerializer.name}(${filteredParamsValue}) : undefined` : filteredParamsValue : void 0;
	const isGet = verb === "get";
	const isUrlOnly = !(!isGet || !!bodyValue || !!paramsValue || !!headersAccess) && !bodyForm;
	const requestLines = [
		`url: \`${route}\``,
		isGet ? void 0 : `method: '${verb.toUpperCase()}'`,
		bodyValue ? `body: ${bodyValue}` : void 0,
		paramsValue ? `params: ${paramsValue}` : void 0,
		headersAccess ? `headers: ${headersAccess}` : void 0
	].filter(Boolean);
	return {
		bodyForm,
		request: isUrlOnly ? `\`${route}\`` : `({\n      ${requestLines.join(",\n      ")}\n    })`,
		isUrlOnly,
		bodyGuard
	};
};
const getHttpResourceResponseImports = (response) => {
	const successDefinition = response.definition.success;
	if (!successDefinition) return [];
	return response.imports.filter((imp) => {
		const name = imp.alias ?? imp.name;
		return new RegExp(String.raw`\b${escapeRegExp(name)}\b`, "g").test(successDefinition);
	});
};
const getParseSchemaName = (response, factory, output, responseTypeOverride) => {
	if (factory !== "httpResource") return void 0;
	const zodSchema = response.imports.find((imp) => imp.isZodSchema);
	if (zodSchema) return zodSchema.name;
	if (!output.override.angular.runtimeValidation.enabled) return void 0;
	if (!isZodSchemaOutput(output)) return void 0;
	const responseType = responseTypeOverride ?? response.definition.success;
	if (!responseType) return void 0;
	if (isPrimitiveType(responseType)) return void 0;
	if (!response.imports.some((imp) => imp.name === responseType)) return void 0;
	return responseType;
};
const getHttpResourceZodParsedImportNames = (response, output) => {
	const names = /* @__PURE__ */ new Set();
	for (const successType of response.types.success) {
		const schemaName = getParseSchemaName(response, getHttpResourceFactory(response, successType.contentType, successType.value), output, successType.value);
		if (schemaName) names.add(schemaName);
	}
	return names;
};
const getHttpResourceVerbImports = (verbOptions, output) => {
	const { response, body, queryParams, props, headers, params } = verbOptions;
	const responseImports = getHttpResourceResponseImports(response);
	const parsedZodImportNames = isZodSchemaOutput(output) ? getHttpResourceZodParsedImportNames(response, output) : /* @__PURE__ */ new Set();
	const parsedZodImports = responseImports.filter((imp) => parsedZodImportNames.has(imp.name));
	return [
		...responseImports.map((imp) => parsedZodImportNames.has(imp.name) ? {
			...imp,
			values: true
		} : imp),
		...parsedZodImports.filter((imp) => !isPrimitiveType(imp.name)).map((imp) => ({
			name: getSchemaOutputTypeRef(imp.name),
			zodBaseName: imp.name
		})),
		...body.imports,
		...props.flatMap((prop) => prop.type === GetterPropType.NAMED_PATH_PARAMS ? [{ name: prop.schema.name }] : []),
		...queryParams ? [{ name: queryParams.schema.name }] : [],
		...headers ? [{ name: headers.schema.name }] : [],
		...params.flatMap(({ imports }) => imports),
		{
			name: "map",
			values: true,
			importPath: "rxjs"
		}
	];
};
const getParseExpression = (response, factory, output, operationName, responseTypeOverride) => {
	const schemaName = getParseSchemaName(response, factory, output, responseTypeOverride);
	return schemaName ? emitResponseValidation({
		schemaRef: schemaName,
		operationName,
		strategy: output.override.angular.runtimeValidation.strategy,
		context: "parse-fn"
	}) : void 0;
};
/**
* Builds the literal option entries that Orval injects into generated
* `httpResource()` calls.
*
* This merges user-supplied generator configuration such as `defaultValue` or
* `debugName` with automatically derived runtime-validation hooks like
* `parse: Schema.parse`.
*
* @returns The option entries plus metadata about whether a configured default value exists.
*/
const buildHttpResourceOptionsLiteral = (verbOption, factory, output, responseTypeOverride) => {
	const override = getHttpResourceOverride(verbOption, output);
	const parseExpression = getParseExpression(verbOption.response, factory, output, verbOption.operationName, responseTypeOverride);
	const defaultValueLiteral = override?.defaultValue === void 0 ? void 0 : JSON.stringify(override.defaultValue);
	return {
		entries: [
			parseExpression ? `parse: ${parseExpression}` : void 0,
			defaultValueLiteral ? `defaultValue: ${defaultValueLiteral}` : void 0,
			override?.debugName === void 0 ? void 0 : `debugName: ${JSON.stringify(override.debugName)}`,
			override?.injector ? `injector: ${override.injector}` : void 0,
			override?.equal ? `equal: ${override.equal}` : void 0
		].filter((value) => value !== void 0),
		hasDefaultValue: defaultValueLiteral !== void 0
	};
};
const appendArgument = (args, argument) => {
	const normalizedArgs = args.trim().replace(/,\s*$/, "");
	return normalizedArgs.length > 0 ? `${normalizedArgs},
  ${argument}` : argument;
};
const normalizeOptionalParametersForRequiredTrailingArg = (args) => args.replaceAll(/(\w+)\?:\s*([^,\n]+)(,?)/g, "$1: $2 | undefined$3");
const buildHttpResourceOptionsArgument = (valueType, rawType, options, omitParse = false) => {
	const baseType = `${HTTP_RESOURCE_OPTIONS_TYPE_NAME}<${valueType}, ${rawType}${omitParse ? ", true" : ""}>`;
	return options.requiresDefaultValue ? `options: ${baseType} & { defaultValue: NoInfer<${valueType}> }` : `options?: ${baseType}`;
};
const buildHttpResourceOptionsExpression = (configuredEntries) => {
	if (configuredEntries.length === 0) return "options";
	return `{
    ...(options ?? {}),
    ${configuredEntries.join(",\n    ")}
  }`;
};
const buildHttpResourceFunctionSignatures = (resourceName, args, valueType, rawType, hasConfiguredDefaultValue, omitParse = false) => {
	if (hasConfiguredDefaultValue) return `export function ${resourceName}(${appendArgument(args, buildHttpResourceOptionsArgument(valueType, rawType, { requiresDefaultValue: false }, omitParse))}): HttpResourceRef<${valueType}>`;
	return `export function ${resourceName}(${appendArgument(normalizeOptionalParametersForRequiredTrailingArg(args), buildHttpResourceOptionsArgument(valueType, rawType, { requiresDefaultValue: true }, omitParse))}): HttpResourceRef<${valueType}>;
export function ${resourceName}(${appendArgument(args, buildHttpResourceOptionsArgument(valueType, rawType, { requiresDefaultValue: false }, omitParse))}): HttpResourceRef<${valueType} | undefined>`;
};
/**
* Generates a single Angular `httpResource` helper function for an operation.
*
* The generated output handles signal-wrapped parameters, route interpolation,
* request-body construction, content-type branching, runtime validation, and
* optional mutator integration when the mutator is compatible with standalone
* resource functions.
*
* @remarks
* This function emits overloads when content negotiation or caller-supplied
* `defaultValue` support requires multiple signatures.
*
* @returns A string containing the complete generated resource helper.
*/
const buildHttpResourceFunction = (verbOption, route, output) => {
	const { operationName, typeName, response, props, params, mutator } = verbOption;
	const dataType = response.definition.success || "unknown";
	const omitParse = isZodSchemaOutput(output);
	const responseSchemaImports = getHttpResourceResponseImports(response);
	const hasResponseSchemaImport = responseSchemaImports.some((imp) => imp.name === dataType);
	const resourceName = `${operationName}Resource`;
	const parsedDataType = omitParse && output.override.angular.runtimeValidation.enabled && !isPrimitiveType(dataType) && hasResponseSchemaImport ? getSchemaOutputTypeRef(dataType) : dataType;
	const successTypes = response.types.success;
	const overallReturnType = successTypes.length <= 1 ? parsedDataType : [...new Set(successTypes.map((type) => getHttpResourceGeneratedResponseType(type.value, type.contentType, responseSchemaImports, output)))].join(" | ") || parsedDataType;
	resourceReturnTypesRegistry.set(operationName, `export type ${pascal(typeName)}ResourceResult = NonNullable<${overallReturnType}>`);
	const uniqueContentTypes = getUniqueContentTypes(successTypes);
	const defaultSuccess = getDefaultSuccessType(successTypes, dataType);
	const jsonContentType = successTypes.find((type) => type.contentType.includes("json"))?.contentType;
	const preferredContentType = jsonContentType ?? defaultSuccess.contentType;
	const resourceFactory = getHttpResourceFactory(response, preferredContentType, dataType);
	const hasNamedParams = props.some((prop) => prop.type === GetterPropType.NAMED_PATH_PARAMS);
	const signalRoute = applySignalRoute(route, params, hasNamedParams);
	let encodedRoute = output.urlEncodeParameters ? makeRouteSafe(signalRoute, new Set(params.filter((p) => p.allowReserved).map((p) => p.name))) : signalRoute;
	const baseUrlOption = output.override.angular.baseUrl;
	if (baseUrlOption) encodedRoute = "${baseUrl}" + encodedRoute;
	const baseUrlDeclaration = baseUrlOption ? `const baseUrl = options?.injector ? options.injector.get(${getBaseUrlTokenName(baseUrlOption.apiId)}) : inject(${getBaseUrlTokenName(baseUrlOption.apiId)});\n  ` : "";
	const signalProps = buildSignalProps(props, params);
	const args = toObjectString(signalProps, "implementation");
	const { bodyForm, request, isUrlOnly, bodyGuard } = buildResourceRequest(verbOption, encodedRoute, { supportsIdleGuard: uniqueContentTypes.length <= 1 });
	if (uniqueContentTypes.length > 1) {
		const defaultContentType = jsonContentType ?? defaultSuccess.contentType;
		const acceptTypeName = getAcceptHelperName(typeName);
		const requiredProps = signalProps.filter((_, index) => props[index]?.required && !props[index]?.default);
		const optionalProps = signalProps.filter((_, index) => !props[index]?.required || props[index]?.default);
		const requiredPart = requiredProps.map((prop) => prop.implementation).join(",\n    ");
		const optionalPart = optionalProps.map((prop) => prop.implementation).join(",\n    ");
		const getBranchReturnType = (type) => getHttpResourceGeneratedResponseType(type.value, type.contentType, responseSchemaImports, output);
		const unionReturnType = [...new Set(successTypes.filter((type) => type.contentType).map((type) => getBranchReturnType(type)))].join(" | ");
		const getBranchRawType = (type) => getHttpResourceRawType(getHttpResourceFactory(response, type.contentType, type.value));
		const implementationOptionsType = [...new Set(successTypes.filter((type) => type.contentType).map((type) => buildBranchOptionsType(getBranchReturnType(type), getBranchRawType(type), omitParse)))].join(" | ");
		const branchOverloads = successTypes.filter((type) => type.contentType).map((type) => {
			const returnType = getBranchReturnType(type);
			const overloadArgs = [
				requiredPart,
				`accept: '${jsStringLiteralEscape(type.contentType ?? "")}'`,
				optionalPart,
				`options?: ${buildBranchOptionsType(returnType, getBranchRawType(type), omitParse)}`
			].filter(Boolean).join(",\n    ");
			return `export function ${resourceName}(${overloadArgs}): HttpResourceRef<${returnType} | undefined>;`;
		}).join("\n");
		const implementationArgsWithDefault = [
			requiredPart,
			`accept: ${acceptTypeName} = '${jsStringLiteralEscape(defaultContentType)}'`,
			optionalPart,
			`options?: ${implementationOptionsType}`
		].filter(Boolean).join(",\n    ");
		const getBranchOptions = (type) => {
			if (!type) return `options as ${buildBranchOptionsType(unionReturnType, "unknown", omitParse)}`;
			const factory = getHttpResourceFactory(response, type.contentType, type.value);
			const branchOptions = buildHttpResourceOptionsLiteral(verbOption, factory, output, type.value);
			return `${buildHttpResourceOptionsExpression(branchOptions.entries) ?? "options"} as unknown as ${buildBranchOptionsType(getBranchReturnType(type), getHttpResourceRawType(factory), omitParse)}`;
		};
		const jsonType = successTypes.find((type) => type.contentType.includes("json") || type.contentType.includes("+json"));
		const textType = successTypes.find((type) => isResponseText(type.contentType, type.value));
		const arrayBufferType = successTypes.find((type) => isResponseArrayBuffer(type.contentType));
		const blobType = successTypes.find((type) => isResponseBlob(type.contentType, response.isBlob));
		const fallbackType = successTypes.find((type) => type.contentType === defaultContentType) ?? jsonType ?? textType ?? arrayBufferType ?? blobType;
		const buildFallbackReturn = (type) => {
			const factory = getHttpResourceFactory(response, type.contentType, type.value);
			return `return ${factory}<${factory === "httpResource" ? getBranchReturnType(type) : getHttpResourceRawType(factory)}>(buildRequest, ${getBranchOptions(type)});`;
		};
		const fallbackReturn = fallbackType ? buildFallbackReturn(fallbackType) : `return httpResource<${parsedDataType}>(buildRequest, ${getBranchOptions()});`;
		const normalizeRequest = isUrlOnly ? `const normalizedRequest: HttpResourceRequest = { url: request };` : `const normalizedRequest: HttpResourceRequest = request;`;
		return `/**
 * @remarks httpResource is available in Angular 19.2 and later.
 */
${branchOverloads}
export function ${resourceName}(
    ${implementationArgsWithDefault}
): HttpResourceRef<${unionReturnType} | undefined> {
  ${baseUrlDeclaration}const buildRequest = (): HttpResourceRequest => {
    ${bodyForm ? `${bodyForm};` : ""}
    const request = ${request};
    ${normalizeRequest}
    const extendedRequest = applyOrvalRequestExtension(normalizedRequest, options);
    return {
      ...extendedRequest,
      headers: extendedRequest.headers instanceof HttpHeaders
        ? extendedRequest.headers.set('Accept', accept)
        : { ...(extendedRequest.headers ?? {}), Accept: accept },
    };
  };

  if (accept.includes('json') || accept.includes('+json')) {
    return httpResource<${jsonType ? getBranchReturnType(jsonType) : parsedDataType}>(buildRequest, ${getBranchOptions(jsonType)});
  }

  if (accept.startsWith('text/') || accept.includes('xml')) {
    return httpResource.text<string>(buildRequest, ${getBranchOptions(textType)});
  }

  ${blobType ? `if (accept.startsWith('image/') || accept.includes('blob')) {
    return httpResource.blob<Blob>(buildRequest, ${getBranchOptions(blobType)});
  }

  ` : ""}${arrayBufferType ? `if (accept.includes('octet-stream') || accept.includes('pdf')) {
    return httpResource.arrayBuffer<ArrayBuffer>(buildRequest, ${getBranchOptions(arrayBufferType)});
  }

  ` : ""}${fallbackReturn}
}
`;
	}
	const resourceOptions = buildHttpResourceOptionsLiteral(verbOption, resourceFactory, output);
	const rawType = getHttpResourceRawType(resourceFactory);
	const resourceValueType = resourceOptions.hasDefaultValue ? parsedDataType : `${parsedDataType} | undefined`;
	const functionSignatures = buildHttpResourceFunctionSignatures(resourceName, args, parsedDataType, rawType, resourceOptions.hasDefaultValue, omitParse);
	const implementationArgs = appendArgument(args, buildHttpResourceOptionsArgument(parsedDataType, rawType, { requiresDefaultValue: false }, omitParse));
	const optionsExpression = buildHttpResourceOptionsExpression(resourceOptions.entries);
	const resourceCallOptions = optionsExpression ? `, ${optionsExpression}` : "";
	const isResourceCompatibleMutator = mutator !== void 0 && !mutator.hasSecondArg;
	const returnExpression = isResourceCompatibleMutator ? `${mutator.name}(request)` : "request";
	if (isUrlOnly && !isResourceCompatibleMutator) return `/**
 * @remarks httpResource is available in Angular 19.2 and later.
 */
${functionSignatures};
export function ${resourceName}(${implementationArgs}): HttpResourceRef<${resourceValueType}> {
  ${baseUrlDeclaration}return ${resourceFactory}<${parsedDataType}>(() => applyOrvalRequestExtension(${request}, options)${resourceCallOptions});
}
`;
	return `/**
 * @remarks httpResource is available in Angular 19.2 and later.
 */
${functionSignatures};
export function ${resourceName}(${implementationArgs}): HttpResourceRef<${resourceValueType}> {
  ${baseUrlDeclaration}return ${resourceFactory}<${parsedDataType}>(() => {
    ${[bodyGuard, bodyForm ? `${bodyForm};` : void 0].filter(Boolean).join("\n    ")}
    const request = ${request};
    return applyOrvalRequestExtension(${returnExpression}, options);
  }${resourceCallOptions});
}
`;
};
const buildHttpResourceOptionsUtilities = (omitParse) => `
export interface ${HTTP_RESOURCE_REQUEST_EXTENSION_TYPE_NAME} {
  /** Extra headers merged over generated headers. Pass a function to read signals reactively. */
  headers?: HttpResourceRequest['headers'] | (() => HttpResourceRequest['headers']);
  /** Angular HttpContext forwarded to the underlying request. Pass a function to derive it reactively. */
  context?: HttpContext | (() => HttpContext);
  /** Last-resort escape hatch: transform the final request descriptor. Runs inside the resource's reactive context. */
  request?: (request: HttpResourceRequest) => HttpResourceRequest;
}

export type ${HTTP_RESOURCE_OPTIONS_TYPE_NAME}<TValue, TRaw = unknown, TOmitParse extends boolean = ${omitParse}> =
  (TOmitParse extends true
    ? Omit<HttpResourceOptions<TValue, TRaw>, 'parse'>
    : HttpResourceOptions<TValue, TRaw>) &
  ${HTTP_RESOURCE_REQUEST_EXTENSION_TYPE_NAME};

function mergeOrvalResourceHeaders(
  base: HttpResourceRequest['headers'],
  extra: NonNullable<HttpResourceRequest['headers']>,
): NonNullable<HttpResourceRequest['headers']> {
  if (!base) return extra;
  if (base instanceof HttpHeaders || extra instanceof HttpHeaders) {
    const toHeaderValue = (
      value: string | readonly string[],
    ): string | string[] =>
      Array.isArray(value) ? Array.from(value, String) : String(value);
    let merged =
      base instanceof HttpHeaders
        ? base
        : Object.entries(base).reduce(
            (headers, [key, value]) => headers.set(key, toHeaderValue(value)),
            new HttpHeaders(),
          );
    const extraRecord =
      extra instanceof HttpHeaders
        ? extra.keys().reduce<Record<string, string[]>>((record, key) => {
            const values = extra.getAll(key);
            if (values) record[key] = values;
            return record;
          }, {})
        : extra;
    for (const [key, value] of Object.entries(extraRecord)) {
      merged = merged.set(key, toHeaderValue(value));
    }
    return merged;
  }
  return { ...base, ...extra };
}

export function ${APPLY_REQUEST_EXTENSION_FUNCTION_NAME}(
  request: string | HttpResourceRequest,
  options?: ${HTTP_RESOURCE_REQUEST_EXTENSION_TYPE_NAME},
): HttpResourceRequest {
  const base: HttpResourceRequest = typeof request === 'string' ? { url: request } : request;
  if (
    !options ||
    (options.headers === undefined &&
      options.context === undefined &&
      options.request === undefined)
  ) {
    return base;
  }
  let next: HttpResourceRequest = { ...base };
  const extraHeaders =
    typeof options.headers === 'function' ? options.headers() : options.headers;
  if (extraHeaders) {
    next = { ...next, headers: mergeOrvalResourceHeaders(next.headers, extraHeaders) };
  }
  const context =
    typeof options.context === 'function' ? options.context() : options.context;
  if (context !== undefined) {
    next = { ...next, context };
  }
  return options.request ? options.request(next) : next;
}
`;
const getContentTypeReturnType = (contentType, value) => {
	if (!contentType) return value;
	if (contentType.includes("json") || contentType.includes("+json")) return value;
	if (contentType.startsWith("text/") || contentType.includes("xml")) return "string";
	if (isResponseArrayBuffer(contentType)) return "ArrayBuffer";
	return "Blob";
};
const getHttpResourceGeneratedResponseType = (value, contentType, responseImports, output) => {
	if (isZodSchemaOutput(output) && output.override.angular.runtimeValidation.enabled && !!contentType && (contentType.includes("json") || contentType.includes("+json")) && !isPrimitiveType(value) && responseImports.some((imp) => imp.name === value)) return getSchemaOutputTypeRef(value);
	return getContentTypeReturnType(contentType, value);
};
const buildBranchOptionsType = (valueType, rawType, omitParse) => `${HTTP_RESOURCE_OPTIONS_TYPE_NAME}<${valueType}, ${rawType}${omitParse ? ", true" : ""}>`;
const buildResourceStateUtilities = () => `
/**
 * Utility type for httpResource results with status tracking.
 * Inspired by @angular-architects/ngrx-toolkit withResource pattern.
 *
 * Uses \`globalThis.Error\` to avoid collision with API model types named \`Error\`.
 */
export interface ${RESOURCE_STATE_TYPE_NAME}<T> {
  readonly value: Signal<T | undefined>;
  readonly status: Signal<ResourceStatus>;
  readonly error: Signal<globalThis.Error | undefined>;
  readonly isLoading: Signal<boolean>;
  /** Guard reads of \`value()\` with this call: \`value()\` throws in the error state. */
  readonly hasValue: () => this is ${RESOLVED_RESOURCE_STATE_TYPE_NAME}<T>;
  readonly reload: () => boolean;
}

export interface ${RESOLVED_RESOURCE_STATE_TYPE_NAME}<T> extends ${RESOURCE_STATE_TYPE_NAME}<T> {
  readonly value: Signal<Exclude<T, undefined>>;
}

/**
 * Wraps an HttpResourceRef to expose a consistent ResourceState interface.
 * Useful when integrating with NgRx SignalStore via withResource().
 */
export function ${TO_RESOURCE_STATE_FUNCTION_NAME}<T>(ref: HttpResourceRef<T>): ${RESOURCE_STATE_TYPE_NAME}<T> {
  return {
    value: ref.value,
    status: ref.status,
    error: ref.error,
    isLoading: ref.isLoading,
    hasValue(this: ${RESOURCE_STATE_TYPE_NAME}<T>): this is ${RESOLVED_RESOURCE_STATE_TYPE_NAME}<T> {
      return ref.hasValue();
    },
    reload: () => ref.reload(),
  };
}
`;
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
const generateHttpResourceHeader = ({ title, isRequestOptions, isMutator, isGlobalMutator, provideIn, output, verbOptions, tag }) => {
	resetHttpClientReturnTypes();
	resourceReturnTypesRegistry.reset();
	const relevantVerbOptions = getRelevantVerbOptionsForTag(verbOptions, tag);
	const retrievals = relevantVerbOptions.filter((verbOption) => isRetrievalVerb(verbOption.verb, verbOption.operationName, getClientOverride(verbOption)));
	const hasBuiltInFilteredQueryParams = retrievals.some((verbOption) => !!verbOption.queryParams && !verbOption.paramsFilter);
	const resources = retrievals.map((verbOption) => {
		const fullRoute = routeRegistry.get(verbOption.operationName, verbOption.route);
		return buildHttpResourceFunction(verbOption, fullRoute, output);
	}).join("\n");
	const resourceTypes = resourceReturnTypesRegistry.getFooter(retrievals.map((verbOption) => verbOption.operationName));
	const mutations = relevantVerbOptions.filter((verbOption) => isMutationVerb(verbOption.verb, verbOption.operationName, getClientOverride(verbOption)));
	const acceptHelpers = buildAcceptHelpers([...retrievals, ...mutations], output);
	const hasMutationBuiltInFilteredQueryParams = mutations.some((verbOption) => !!verbOption.queryParams && !verbOption.paramsFilter);
	const hasObjectParams = [...retrievals, ...mutations].some(hasGatedObjectQueryParamStrategies);
	const filterParamsHelper = hasBuiltInFilteredQueryParams ? `\n${getAngularFilteredParamsHelperBody({ hasObjectParams })}\n` : "";
	const mutationImplementation = mutations.map((verbOption) => {
		const generatorOptions = {
			route: routeRegistry.get(verbOption.operationName, verbOption.route),
			context: { output }
		};
		return generateHttpClientImplementation(verbOption, generatorOptions);
	}).join("\n");
	const baseUrlOption = output.override.angular.baseUrl;
	const classImplementation = mutationImplementation ? `
${buildServiceClassOpen({
		title,
		isRequestOptions,
		isMutator,
		isGlobalMutator,
		provideIn,
		hasQueryParams: hasMutationBuiltInFilteredQueryParams && !hasBuiltInFilteredQueryParams,
		baseUrlFieldInitializer: baseUrlOption ? `private readonly baseUrl = inject(${getBaseUrlTokenName(baseUrlOption.apiId)});` : void 0,
		hasObjectParams: mutations.some(hasGatedObjectQueryParamStrategies)
	})}
${mutationImplementation}
};
` : "";
	return `${buildHttpResourceOptionsUtilities(isZodSchemaOutput(output))}${filterParamsHelper}${acceptHelpers ? `${acceptHelpers}\n\n` : ""}${resources}${classImplementation}${resourceTypes ? `\n${resourceTypes}\n` : ""}`;
};
/**
* Generates the footer for Angular `httpResource` output.
*
* The footer appends any registered `ClientResult` aliases coming from shared
* `HttpClient` mutation methods and the resource-state helper utilities emitted
* for generated Angular resources.
*
* @returns The footer text for the generated Angular resource file.
*/
const generateHttpResourceFooter = ({ operationNames }) => {
	const clientTypes = getHttpClientReturnTypes(operationNames);
	const utilities = buildResourceStateUtilities();
	return `${clientTypes ? `${clientTypes}\n` : ""}${utilities}`;
};
/**
* Per-operation builder used during Angular `httpResource` generation.
*
* Unlike the `HttpClient` builder, the actual implementation body is emitted in
* the header phase after all operations are known. This function mainly records
* the resolved route and returns the imports required by the current operation.
*
* @returns An empty implementation plus the imports required by the operation.
*/
const generateHttpResourceClient = (verbOptions, options) => {
	routeRegistry.set(verbOptions.operationName, options.route);
	const baseUrlOption = options.context.output.override.angular.baseUrl;
	const mutationImports = isMutationVerb(verbOptions.verb, verbOptions.operationName, getClientOverride(verbOptions)) ? [getAngularHttpResponseImport(narrowsResponseEvents(verbOptions, options.context.output))] : [];
	return {
		implementation: "\n",
		imports: [
			...getHttpResourceVerbImports(verbOptions, options.context.output),
			...mutationImports,
			...baseUrlOption ? [{
				name: getBaseUrlTokenName(baseUrlOption.apiId),
				values: true,
				importPath: getAngularBaseUrlImportSpecifier(options.context.output)
			}] : []
		]
	};
};
const buildHttpResourceFile = (verbOptions, output, context) => {
	resourceReturnTypesRegistry.reset();
	const retrievals = Object.values(verbOptions).filter((verbOption) => isRetrievalVerb(verbOption.verb, verbOption.operationName, getClientOverride(verbOption)));
	const hasBuiltInFilteredQueryParams = retrievals.some((verbOption) => !!verbOption.queryParams && !verbOption.paramsFilter);
	const hasObjectParams = retrievals.some(hasGatedObjectQueryParamStrategies);
	const filterParamsHelper = hasBuiltInFilteredQueryParams ? `\n${getAngularFilteredParamsHelperBody({ hasObjectParams })}\n` : "";
	const resources = retrievals.map((verbOption) => {
		const fullRoute = getFullRoute(verbOption.route, context.spec.servers, output.baseUrl);
		return buildHttpResourceFunction(verbOption, fullRoute, output);
	}).join("\n");
	const resourceTypes = resourceReturnTypesRegistry.getFooter(Object.values(verbOptions).map((verbOption) => verbOption.operationName));
	const utilities = buildResourceStateUtilities();
	return `${buildHttpResourceOptionsUtilities(isZodSchemaOutput(output))}${filterParamsHelper}${resources}\n${resourceTypes ? `${resourceTypes}\n` : ""}${utilities}`;
};
/**
* Names of the `Accept` helpers the resource file uses but does not declare.
*
* @remarks
* In `both` mode the service sibling (`HttpClient` output) covers every
* operation of the same scope and already exports one `<Op>Accept` helper per
* multi-content-type operation. The resource file must not redeclare them:
* the `tags-split` barrel does `export *` from both siblings, and two
* declarations of one name make that ambiguous (TS2308). One declaration,
* one owner — the resource file imports the helper instead.
*
* @returns The helper names to import from the service sibling.
*/
const buildAcceptHelperImports = (retrievals) => retrievals.filter((verbOption) => getUniqueContentTypes(verbOption.response.types.success).length > 1).map((verbOption) => ({ name: getAcceptHelperName(verbOption.typeName) }));
/**
* Resolves the schema imports of a generated `*.resource.ts` file. Uses core's
* {@link resolveSchemaImportDependencies} so a resource file and its sibling
* service file agree on the module that exports each schema.
*/
const buildSchemaImportDependencies = (output, imports, relativeSchemasPath, schemaTagMap, schemaOutputPlan) => {
	const isZod = isZodSchemaOutput(output);
	return output.schemas ? resolveSchemaImportDependencies(output, imports, relativeSchemasPath, {
		isZod,
		schemaTagMap,
		schemaOutputPlan
	}) : [{
		exports: dedupeSchemaImports(imports),
		dependency: relativeSchemasPath
	}];
};
const getHttpResourceExtraFilePath = (output, tag) => {
	const { extension, dirname, filename } = getFileInfo(output.target, { extension: output.fileExtension });
	switch (output.mode) {
		case OutputMode.TAGS: {
			const normalizedTag = getTagKey(tag);
			return upath.joinSafe(dirname, `${normalizedTag}.resource${extension}`);
		}
		case OutputMode.TAGS_SPLIT: {
			const normalizedTag = getTagKey(tag);
			return upath.joinSafe(dirname, normalizedTag, `${normalizedTag}.resource${extension}`);
		}
		default: return upath.joinSafe(dirname, `${filename}.resource${extension}`);
	}
};
/**
* Path of the `HttpClient` service file that sits next to the resource file
* produced by {@link getHttpResourceExtraFilePath}.
*
* @remarks
* Mirrors the core writers: `split` and `tags-split` add a `.service` suffix
* for the Angular client, `single` and `tags` do not.
*/
const getHttpResourceServiceFilePath = (output, tag) => {
	const { extension, dirname, filename } = getFileInfo(output.target, { extension: output.fileExtension });
	switch (output.mode) {
		case OutputMode.TAGS: return upath.joinSafe(dirname, `${getTagKey(tag)}${extension}`);
		case OutputMode.TAGS_SPLIT: {
			const normalizedTag = getTagKey(tag);
			return upath.joinSafe(dirname, normalizedTag, `${normalizedTag}.service${extension}`);
		}
		case OutputMode.SPLIT: return upath.joinSafe(dirname, `${filename}.service${extension}`);
		default: return upath.joinSafe(dirname, `${filename}${extension}`);
	}
};
const getHttpResourceSchemasModule = (output, outputPath) => {
	const customImportPath = getSchemasImportPath(output.schemas);
	if (customImportPath) return customImportPath;
	const schemasPath = typeof output.schemas === "string" ? output.schemas : output.schemas?.path;
	if (schemasPath) return upath.getRelativeImportPath(outputPath, schemasPath, true);
	const { dirname, filename, extension } = getFileInfo(output.target, { extension: output.fileExtension });
	return upath.getRelativeImportPath(outputPath, upath.joinSafe(dirname, `${filename}.schemas${extension}`), output.fileExtension !== ".ts");
};
const buildHttpResourceExtraFile = (verbOptions, outputPath, servicePath, output, context, header, schemaTagMap, schemaOutputPlan) => {
	const implementation = buildHttpResourceFile(verbOptions, output, context);
	const retrievals = Object.values(verbOptions).filter((verbOption) => isRetrievalVerb(verbOption.verb, verbOption.operationName, getClientOverride(verbOption)));
	const verbImports = retrievals.flatMap((verbOption) => getHttpResourceVerbImports(verbOption, output));
	const acceptHelperImports = buildAcceptHelperImports(retrievals);
	const serviceDependency = acceptHelperImports.length > 0 ? [{
		exports: acceptHelperImports,
		dependency: upath.getRelativeImportPath(outputPath, servicePath, output.fileExtension !== ".ts")
	}] : [];
	const schemaVerbImports = verbImports.filter((imp) => !imp.importPath);
	const externalVerbImports = mergeDependencies(verbImports.filter((imp) => !!imp.importPath).map((imp) => ({
		exports: [imp],
		dependency: imp.importPath
	})));
	const schemaImports = buildSchemaImportDependencies(output, schemaVerbImports, getHttpResourceSchemasModule(output, outputPath), schemaTagMap, schemaOutputPlan);
	const dependencies = getAngularHttpResourceOnlyDependencies(false, false);
	const baseUrlOption = output.override.angular.baseUrl;
	const baseUrlDependency = baseUrlOption ? [{
		exports: [{
			name: getBaseUrlTokenName(baseUrlOption.apiId),
			values: true
		}],
		dependency: upath.getRelativeImportPath(outputPath, getAngularBaseUrlFilePath(output), output.fileExtension !== ".ts")
	}] : [];
	const importImplementation = generateDependencyImports(implementation, [
		...schemaImports,
		...externalVerbImports,
		...serviceDependency,
		...dependencies,
		...baseUrlDependency
	], context.projectName, !!output.schemas, isSyntheticDefaultImportsAllow(output.tsconfig));
	const mutators = Object.values(verbOptions).filter((verbOption) => isRetrievalVerb(verbOption.verb, verbOption.operationName, getClientOverride(verbOption))).flatMap((verbOption) => {
		return [
			verbOption.mutator && !verbOption.mutator.hasSecondArg ? verbOption.mutator : void 0,
			verbOption.formData,
			verbOption.formUrlEncoded,
			verbOption.paramsSerializer,
			verbOption.paramsFilter
		].filter((value) => value !== void 0);
	});
	return {
		content: `${header}${importImplementation}${mutators.length > 0 ? generateMutatorImports({
			mutators,
			oneMore: output.mode === OutputMode.TAGS_SPLIT
		}) : ""}${implementation}`,
		path: outputPath,
		barrelExport: true,
		sharedExports: HTTP_RESOURCE_SHARED_EXPORTS
	};
};
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
const generateHttpResourceExtraFiles = (verbOptions, output, context, schemaTagMap, schemaOutputPlan) => {
	const header = getHeader(output.override.header, context.spec.info);
	if (!hasRetrievalOperations(verbOptions)) return Promise.resolve([]);
	if (output.mode === OutputMode.TAGS || output.mode === OutputMode.TAGS_SPLIT) {
		const groupedVerbOptions = /* @__PURE__ */ new Map();
		for (const verbOption of Object.values(verbOptions)) {
			const tag = getPrimaryTag(verbOption);
			const currentGroup = groupedVerbOptions.get(tag) ?? {};
			currentGroup[verbOption.operationId] = verbOption;
			groupedVerbOptions.set(tag, currentGroup);
		}
		return Promise.resolve([...groupedVerbOptions.entries()].filter(([, tagVerbOptions]) => hasRetrievalOperations(tagVerbOptions)).map(([tag, tagVerbOptions]) => buildHttpResourceExtraFile(tagVerbOptions, getHttpResourceExtraFilePath(output, tag), getHttpResourceServiceFilePath(output, tag), output, context, header, schemaTagMap, schemaOutputPlan)));
	}
	return Promise.resolve([buildHttpResourceExtraFile(getVerbOptionsRecord(getRelevantVerbOptionsForTag(verbOptions)), getHttpResourceExtraFilePath(output), getHttpResourceServiceFilePath(output), output, context, header, schemaTagMap, schemaOutputPlan)]);
};
//#endregion
//#region src/index.ts
const httpClientBuilder = {
	client: generateAngular,
	header: generateAngularHeader,
	dependencies: getAngularDependencies,
	footer: generateAngularFooter,
	title: generateAngularTitle,
	extraFiles: generateAngularBaseUrlExtraFiles
};
const httpResourceBuilder = {
	client: generateHttpResourceClient,
	header: generateHttpResourceHeader,
	dependencies: getAngularHttpResourceDependencies,
	footer: generateHttpResourceFooter,
	title: generateAngularTitle,
	extraFiles: generateAngularBaseUrlExtraFiles
};
const bothClientBuilder = {
	...httpClientBuilder,
	extraFiles: async (verbOptions, output, context, schemaTagMap, schemaOutputPlan) => [...await generateHttpResourceExtraFiles(verbOptions, output, context, schemaTagMap, schemaOutputPlan), ...await generateAngularBaseUrlExtraFiles(verbOptions, output, context)]
};
const builder = () => (options) => {
	switch (options?.client) {
		case "httpResource": return httpResourceBuilder;
		case "both": return bothClientBuilder;
		default: return httpClientBuilder;
	}
};
//#endregion
export { ANGULAR_HTTP_CLIENT_DEPENDENCIES, ANGULAR_HTTP_RESOURCE_DEPENDENCIES, HTTP_CLIENT_OBSERVE_OPTIONS_TEMPLATE, HTTP_CLIENT_OPTIONS_TEMPLATE, PRIMITIVE_TYPES, THIRD_PARAMETER_TEMPLATE, buildAcceptHelpers, buildAngularBaseUrlFileContent, buildServiceClassOpen, builder, builder as default, createReturnTypesRegistry, createRouteRegistry, generateAngular, generateAngularBaseUrlExtraFiles, generateAngularFooter, generateAngularHeader, generateAngularTitle, generateHttpClientImplementation, generateHttpResourceClient, generateHttpResourceExtraFiles, generateHttpResourceFooter, generateHttpResourceHeader, getAcceptHelperName, getAngularBaseUrlFilePath, getAngularBaseUrlImportSpecifier, getAngularDependencies, getAngularHttpImports, getAngularHttpResourceDependencies, getAngularHttpResourceOnlyDependencies, getAngularHttpResponseImport, getBaseUrlConstantPrefix, getBaseUrlResolverContextTypeName, getBaseUrlResolverTokenName, getBaseUrlResolverTypeName, getBaseUrlServerUrlConstantName, getBaseUrlTokenName, getDefaultSuccessType, getHttpClientReturnTypes, getProvideBaseUrlName, getProvideBaseUrlResolverName, getRelevantVerbOptionsForTag, getSchemaOutputTypeRef, getUniqueContentTypes, isDefined, isMutationVerb, isPrimitiveType, isRetrievalVerb, isZodSchemaOutput, narrowsResponseEvents, resetHttpClientReturnTypes, routeRegistry };

//# sourceMappingURL=index.mjs.map