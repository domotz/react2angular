import { IAugmentedJQuery, IComponentOptions } from 'angular'
import fromPairs = require('lodash.frompairs')
import NgComponent from 'ngcomponent'
import * as PropTypes from 'prop-types'
import * as React from 'react'
import { render, unmountComponentAtNode } from 'react-dom'
/**
 * Wraps a React component in Angular. Returns a new Angular component.
 *
 * Usage:
 *
 *   ```ts
 *   type Props = { foo: number }
 *   class ReactComponent extends React.Component<Props, S> {}
 *   const AngularComponent = react2angular(ReactComponent, ['foo'])
 *   ```
 */
export function react2angular<Props>(
  Class: React.ComponentType<Props>,
  bindingNames: (keyof Props)[] | null = null,
  injectNames: string[] = []
): IComponentOptions {
  const names = bindingNames
    || (Class.propTypes && Object.keys(Class.propTypes) as (keyof Props)[])
    || []

  const getPropType = (name: keyof Props): any => {
    return !!Class.propTypes ? Class.propTypes[name] : null
  }
  return {
    bindings: fromPairs(names.map(name => [name, getPropType(name) === PropTypes.string ? '@' : '<'])),
    // bindings: fromPairs(names.map(_ => [_, '<'])),
    controller: ['$element', ...injectNames, class extends NgComponent<Props> {
      static get $$ngIsClass() {
        return true
      }
      isDestroyed = false
      injectedProps: { [name: string]: any }
      constructor(private $element: IAugmentedJQuery, ...injectedProps: any[]) {
        super()
        this.injectedProps = {}
        injectNames.forEach((name, i) => {
          this.injectedProps[name] = injectedProps[i]
        })
      }
      $onInit() {
        names.forEach((name) => {
          this.props[name] = (this as any)[name]
        })
      }
      render() {
        if (!this.isDestroyed) {
          render(
            <Class {...this.props} {...this.injectedProps as any} />,
            this.$element[0]
          )
        }
      }
      componentWillUnmount() {
        this.isDestroyed = true
        unmountComponentAtNode(this.$element[0])
      }
    }]
  }
}
