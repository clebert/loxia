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
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
```

```js
import {useCallback, useEffect, useMemo, useRef, useState} from 'preact/hooks';
```

```js
import {useCallback, useEffect, useMemo, useRef, useState} from 'batis';
```

```js
import {createSenderHook} from 'loxia';

export const useSender = createSenderHook({
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
});
```

```js
import {createReceiverHook} from 'loxia';

export const useReceiver = createReceiverHook({
  useEffect,
  useMemo,
  useRef,
  useState,
});
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
