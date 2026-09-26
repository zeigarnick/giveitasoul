import React from 'react';

// Tiny base class: subclasses compute view values in renderVals() and render them with template(v).
export class DCLogic extends React.Component {
  render() { return this.template(this.renderVals()); }
}
