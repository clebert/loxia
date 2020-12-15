# Loxia

[![][ci-badge]][ci-link] [![][version-badge]][version-link]
[![][license-badge]][license-link] [![][types-badge]][types-link]
[![][size-badge]][size-link]

[ci-badge]: https://github.com/clebert/loxia/workflows/CI/badge.svg
[ci-link]: https://github.com/clebert/loxia
[version-badge]: https://badgen.net/npm/v/loxia
[version-link]: https://www.npmjs.com/package/loxia
[license-badge]: https://badgen.net/npm/license/loxia
[license-link]: https://github.com/clebert/loxia/blob/master/LICENSE
[types-badge]: https://badgen.net/npm/types/loxia
[types-link]: https://github.com/clebert/loxia
[size-badge]: https://badgen.net/bundlephobia/minzip/loxia
[size-link]: https://bundlephobia.com/result?p=loxia

TODO.

<img src="./loxia.jpg"/>

## Installation

```
npm i loxia --save
```

## Usage

```js
import {createReceiverHook, createSenderHook} from 'loxia';
```

```js
import * as React from 'react';

export const useReceiver = createReceiverHook(React);
export const useSender = createSenderHook(React);
```

```js
import * as PreactHooks from 'preact/hooks';

export const useReceiver = createReceiverHook(PreactHooks);
export const useSender = createSenderHook(PreactHooks);
```

```js
import * as Batis from 'batis';

export const useReceiver = createReceiverHook(Batis);
export const useSender = createSenderHook(Batis);
```

## Development

### Publishing a new release

```
npm run release patch
```

```
npm run release minor
```

```
npm run release major
```

After a new release has been created by pushing the tag, it must be published
via the GitHub UI. This triggers the final publication to npm.

---

Copyright (c) 2020, Clemens Akens. Released under the terms of the
[MIT License](https://github.com/clebert/loxia/blob/master/LICENSE).
