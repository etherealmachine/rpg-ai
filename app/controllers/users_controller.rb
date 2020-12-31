class UsersController < Devise::OmniauthCallbacksController
  skip_before_action :verify_authenticity_token, only: [:google_oauth2, :failure]
  before_action ->{ authenticate_user!(force: true) }, only: [:show]

  def google_oauth2
    @google_user = User.from_omniauth(request.env["omniauth.auth"])
    @user = User.find_by(email: @google_user.email)

    if @user.nil? && @google_user
      @google_user.save!
    end
    
    if @user.persisted?
      sign_in_and_redirect @user, event: :authentication
      set_flash_message(:notice, :success, kind: "Google") if is_navigational_format?
    else
      session["devise.google_oauth2_data"] = request.env["omniauth.auth"].except("extra") # Removing extra as it can overflow some session stores
      redirect_to request.referrer
    end
  end

  def failure
    redirect_to root_path
  end

  def show
    @tileset = Tileset.new(user: current_user)
    @tilemap = Tilemap.new(user: current_user)
    @tilemaps = Tilemap.where(user: current_user)
    @tilesets = Tileset.where(user: current_user)
  end
end