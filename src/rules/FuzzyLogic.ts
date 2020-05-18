export class FuzzyRule {
  antecedent: FuzzyClause
  consequence: FuzzyClause

  constructor(antecedent: FuzzyClause, consequence: FuzzyClause) {
    this.antecedent = antecedent;
    this.consequence = consequence;
  }

  evaluate(sets: { [key: string]: { [key: string]: FuzzySet } }, memberships: { [key: string]: { [key: string]: number } }): { [key: string]: FuzzySet } {
    const strength = Math.min(...Object.entries(this.antecedent).map(([varName, setName]) => memberships[varName][setName]).filter(x => x !== undefined));
    return Object.entries(this.consequence).map(([varName, setName]) => {
      return [
        varName,
        sets[varName][setName].alphaCut(strength),
      ]
    }).reduce((obj, [key, value]) => {
      return {
        ...obj,
        [key as string]: value,
      };
    }, {});
  }
}

type FuzzyClause = { [key: string]: string }
type FuzzyMembership = { [key: string]: number }

export class FuzzyVariable {
  name: string
  min: number
  max: number
  resolution: number
  sets: { [key: string]: FuzzySet }

  constructor(name: string, min: number, max: number, resolution: number) {
    this.name = name;
    this.min = min;
    this.max = max;
    this.resolution = resolution;
    this.sets = {};
  }

  addTriangular(name: string, low: number, mid: number, high: number) {
    const s = FuzzySet.triangular(name, this.min, this.max, this.resolution, low, mid, high)
    this.sets[s.name] = s;
    return s
  }

  addTrapezoidal(name: string, a: number, b: number, c: number, d: number) {
    const s = FuzzySet.trapezoidal(name, this.min, this.max, this.resolution, a, b, c, d);
    this.sets[s.name] = s;
    return s
  }

  fuzzify(value: number): FuzzyMembership {
    return Object.entries(this.sets).map(([name, s]) => [name, s.closestMembershipValue(value)]).reduce((obj, [key, value]) => {
      return {
        ...obj,
        [key as string]: value,
      };
    }, {});
  }

}

class FuzzySet {
  name: string
  min: number
  max: number
  resolution: number
  domain: number[]
  membership: number[] = []

  static triangular(name: string, min: number, max: number, resolution: number, a: number, b: number, c: number): FuzzySet {
    const s = new FuzzySet(name, min, max, resolution);
    a = s.closestDomainValue(a);
    b = s.closestDomainValue(b);
    c = s.closestDomainValue(c);
    if (b === a) {
      s.membership = s.domain.map(v => Math.max((c - v) / (c - b), 0));
    } else if (b === c) {
      s.membership = s.domain.map(v => Math.max((v - a) / (b - a), 0));
    } else {
      s.membership = s.domain.map(v => Math.max(Math.min((v - a) / (b - a), (c - v) / (c - b)), 0));
    }
    return s;
  }

  static trapezoidal(name: string, min: number, max: number, resolution: number, a: number, b: number, c: number, d: number): FuzzySet {
    const s = new FuzzySet(name, min, max, resolution);
    a = s.closestDomainValue(a);
    b = s.closestDomainValue(b);
    c = s.closestDomainValue(c);
    d = s.closestDomainValue(d);
    s.membership = s.domain.map(v => Math.min(Math.max(Math.min((v - a) / (b - a), (d - v) / (d - c)), 0), 1));
    return s;
  }

  constructor(name: string, min: number, max: number, resolution: number) {
    this.name = name;
    this.min = min;
    this.max = max;
    this.resolution = resolution;
    this.domain = [];
    for (let i = 0; i < resolution; i++) {
      this.domain.push(min + (max - min) * (i / resolution));
    }
  }

  alphaCut(membership: number): FuzzySet {
    const a = new FuzzySet(`alpha(${this.name}, ${membership})`, this.min, this.max, this.resolution);
    a.membership = this.membership.map(m => Math.min(m, membership));
    return a;
  }

  union(other: FuzzySet): FuzzySet {
    const u = new FuzzySet(`union(${this.name}, ${other.name})`, this.min, this.max, this.resolution);
    u.membership = this.membership.map((v, i) => Math.max(v, other.membership[i]));
    return u
  }

  closestDomainValue(val: number): number {
    const abs = this.domain.map(v => Math.abs(v - val));
    const min = Math.min(...abs);
    const argmin = abs.indexOf(min);
    return this.domain[argmin];
  }

  closestMembershipValue(val: number): number {
    const abs = this.domain.map(v => Math.abs(v - val));
    const min = Math.min(...abs);
    const argmin = abs.indexOf(min);
    return this.membership[argmin];
  }

  defuzzify(): number {
    const numerator = this.membership.map((m, i) => m * this.domain[i]).reduce((sum, v) => sum + v, 0);
    const denominator = this.domain.reduce((sum, v) => sum + v, 0);
    return numerator / denominator;
  }

  lerp(value: number): number {
    return Math.round(this.min + (value * (this.max - this.min)));
  }
}

export class FuzzySystem {

  inputs: { [key: string]: FuzzyVariable } = {}
  outputs: { [key: string]: FuzzyVariable } = {}
  rules: FuzzyRule[] = []

  addInputVariable(v: FuzzyVariable) {
    this.inputs[v.name] = v;
  }

  addOutputVariable(v: FuzzyVariable) {
    this.outputs[v.name] = v;
  }

  addRule(r: FuzzyRule) {
    this.rules.push(r);
  }

  evaluate(crispInputs: { [key: string]: number }): { [key: string]: number } {
    const memberships = Object.entries(crispInputs).map(([varName, val]) => {
      return [varName, this.inputs[varName].fuzzify(val)]
    }).reduce((obj, [key, value]) => ({ ...obj, [key as string]: value }), {});

    const sets = Object.entries(this.outputs).map(([varName, fuzzyVar]) => {
      return [varName, fuzzyVar.sets];
    }).reduce((obj, [key, value]) => ({ ...obj, [key as string]: value }), {});

    const alphaCuts = this.rules.map(rule => rule.evaluate(sets, memberships));

    const cutsByVar = Object.keys(this.outputs)
      .map(varName => [varName, alphaCuts.map(cut => cut[varName])])
      .reduce((obj, [key, value]) => ({ ...obj, [key as string]: value }), {});
    return (Object.entries(cutsByVar) as Array<[string, FuzzySet[]]>).reduce((obj, [varName, cutSets]) => {
      let union = cutSets[0];
      for (let i = 1; i < cutSets.length; i++) {
        union = union.union(cutSets[i]);
      }
      return {
        ...obj,
        [varName]: union.lerp(union.defuzzify()),
      };
    }, {});
  }
}