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

function lerp(value: number, min: number, max: number) {
  return Math.round(min + (value * (max - min)));
}

interface DiscreteRange {
  min: number
  max: number
  resolution: number
}

export class FuzzyVariable implements DiscreteRange {
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
    const s = FuzzySet.triangular(name, this, low, mid, high)
    this.sets[s.name] = s;
    return s
  }

  addTrapezoidal(name: string, a: number, b: number, c: number, d: number) {
    const s = FuzzySet.trapezoidal(name, this, a, b, c, d);
    this.sets[s.name] = s;
    return s
  }

  evenlyDistribute(sets: string[]) {
    if (sets.length === 1) {
      this.addTrapezoidal(sets[0], lerp(0.0, this.min, this.max), lerp(0.25, this.min, this.max), lerp(0.75, this.min, this.max), lerp(1.0, this.min, this.max));
    } else if (sets.length === 2) {
      this.addTrapezoidal(sets[0], lerp(0.0, this.min, this.max), lerp(0.25, this.min, this.max), lerp(0.5, this.min, this.max), lerp(0.75, this.min, this.max));
      this.addTrapezoidal(sets[1], lerp(0.25, this.min, this.max), lerp(0.5, this.min, this.max), lerp(0.75, this.min, this.max), lerp(1.0, this.min, this.max));
    } else if (sets.length === 3) {
      this.addTrapezoidal(sets[0], this.min, this.min, lerp(0.25, this.min, this.max), lerp(0.50, this.min, this.max));
      this.addTriangular(sets[1], lerp(0.25, this.min, this.max), lerp(0.50, this.min, this.max), lerp(0.75, this.min, this.max));
      this.addTrapezoidal(sets[2], lerp(0.50, this.min, this.max), lerp(0.75, this.min, this.max), this.max, this.max);
    } else if (sets.length === 5) {
      this.addTriangular(sets[0], lerp(0.0, this.min, this.max), lerp(0.15, this.min, this.max), lerp(0.30, this.min, this.max));
      this.addTriangular(sets[1], lerp(0.15, this.min, this.max), lerp(0.30, this.min, this.max), lerp(0.45, this.min, this.max));
      this.addTrapezoidal(sets[2], lerp(0.30, this.min, this.max), lerp(0.45, this.min, this.max), lerp(0.55, this.min, this.max), lerp(0.70, this.min, this.max));
      this.addTriangular(sets[3], lerp(0.55, this.min, this.max), lerp(0.70, this.min, this.max), lerp(0.85, this.min, this.max));
      this.addTriangular(sets[4], lerp(0.70, this.min, this.max), lerp(0.85, this.min, this.max), lerp(1.0, this.min, this.max));
    }
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

export class FuzzySet {
  name: string
  range: DiscreteRange
  domain: number[]
  membership: number[] = []

  static triangular(name: string, range: DiscreteRange, a: number, b: number, c: number): FuzzySet {
    const s = new FuzzySet(name, range);
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

  static trapezoidal(name: string, range: DiscreteRange, a: number, b: number, c: number, d: number): FuzzySet {
    const s = new FuzzySet(name, range);
    a = s.closestDomainValue(a);
    b = s.closestDomainValue(b);
    c = s.closestDomainValue(c);
    d = s.closestDomainValue(d);
    s.membership = s.domain.map(v => Math.min(Math.max(Math.min((v - a) / (b - a), (d - v) / (d - c)), 0), 1));
    return s;
  }

  constructor(name: string, range: DiscreteRange) {
    this.name = name;
    this.range = range;
    this.domain = [];
    for (let i = 0; i < range.resolution; i++) {
      this.domain.push(range.min + (range.max - range.min) * (i / range.resolution));
    }
  }

  alphaCut(membership: number): FuzzySet {
    const a = new FuzzySet(`alpha(${this.name}, ${membership})`, this.range);
    a.membership = this.membership.map(m => Math.min(m, membership));
    return a;
  }

  union(other: FuzzySet): FuzzySet {
    const u = new FuzzySet(`union(${this.name}, ${other.name})`, this.range);
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
      .reduce((obj, [key, value]) => ({ ...obj, [key as string]: (value as FuzzySet[]).filter(s => s !== undefined) }), {});
    return (Object.entries(cutsByVar) as Array<[string, FuzzySet[]]>).reduce((obj, [varName, cutSets]) => {
      if (cutSets.length === 0) {
        return {
          ...obj,
          [varName]: NaN,
        };
      }
      let union = cutSets[0];
      for (let i = 1; i < cutSets.length; i++) {
        union = union.union(cutSets[i]);
      }
      return {
        ...obj,
        [varName]: lerp(union.defuzzify(), union.range.min, union.range.max),
      };
    }, {});
  }
}