module ApplicationHelper

  def modifier(score)
    m = ((score - 10) / 2).floor
    m >= 0 ? '+' + m.to_s : m.to_s
  end
end
