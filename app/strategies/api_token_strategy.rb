class ApiTokenStrategy < Warden::Strategies::Base
  def valid?
    api_token.present?
  end

  def authenticate!
    user = User.find_by(api_token: api_token)

    if user
      success!(user)
    else
      fail!('Invalid email or password')
    end
  end

  private

  def api_token
    request.headers['Authorization'].remove('Bearer ') if request.headers['Authorization'].present?
  end
end