module ApplicationHelper

  def modifier(score)
    m = ((score - 10) / 2).floor
    m >= 0 ? '+' + m.to_s : m.to_s
  end

  def size(s)
    case s
    when 'T'
      'Tiny'
    when 'S'
      'Small'
    when 'M'
      'Medium'
    when 'L'
      'Large'
    when 'H'
      'Huge'
    when 'G'
      'Gargantuan'
    end
  end
end
