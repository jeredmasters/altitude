<?php namespace App\Http\Controllers;
      use Input, Session, Response, Email, DB, User, Uquery, Scaffold, Company, AdminUser;
class AdminController extends Controller {

	/*
	|--------------------------------------------------------------------------
	| Home Controller
	|--------------------------------------------------------------------------
	|
	| This controller renders your application's "dashboard" for users that
	| are authenticated. Of course, you are free to change or remove the
	| controller as you wish. It is just here to get your app started!
	|
	*/

	/**
	 * Create a new controller instance.
	 *
	 * @return void
	 */
	public function __construct()
	{
        $this->middleware('auth',['except' => ['getLogin','postLogin','getLogout']]);
	}

    public function getLogout(){
        AdminUser::end();
        return redirect('/admin/login');
    }

    public function getLogin(){
        return view('admin.login');
    }

    public function postLogin(){
        $success = AdminUser::login(Input::get('username'),Input::get('password'));
        if ($success){
            return redirect('/admin/users');
        }
        return redirect('/admin/login');
    }

	/**
	 * Show the application dashboard to the user.
	 *
	 * @return Response
	 */
	public function anyEmails($id = null)
	{
        if ($id == null){
            $emails = Email::where('id','>',-1)
                ->orderBy('created_at','DESC')
                ->limit(10)
                ->get();
            return view('admin.emails',['emails' => $emails]);
        }

        $email = Email::find($id);
        $content = Email::renderEmail($email);
        return view('admin.email',['email' => $email,'content' => $content]);
	}

    public function anyUsers($key_base = null)
	{
        if ($key_base == null){
            $base_keys = DB::table('users')->select('key_base')->distinct()->get();
            $users = array();
            foreach($base_keys as $key_base){
                $users[] = User::where('key_base','=',$key_base->key_base)->orderBy('key','DESC')->first();
            }
            return view('admin.users',['users' => $users]);
        }

        $user = Uquery::get($key_base);
        if (count($user) > 0){
            $user = $user[0];
            $data = array(
                'versions' => User::where('key_base','=',$user->key_base)->get()
                );
            return view('admin.user',['user' => $user, 'data' => $data]);
        }
        return "error";
	}

    public function anyCompanies($id = null)
	{
        if ($id == null){
            $companies = Company::all();
            return view('admin.companies',['companies' => $companies]);
        }

        $company = Company::find($id);
        if ($company != null){
            $data = array(
                'scaffolds' => Scaffold::where('company','=',$company->guid)->get(),
                );

            $base_keys = DB::table('users')->where('company','=',$company->guid)->select('key_base')->distinct()->get();
            $users = array();
            foreach($base_keys as $key_base){
                $users[] = User::where('key_base','=',$key_base->key_base)->orderBy('key','DESC')->first();
            }

            $data['users'] = $users;
            return view('admin.company',['company' => $company, 'data' => $data]);
        }
        return "error";
	}

    public function anyScaffolds($key_base = null)
	{
        if ($key_base == null){
            $base_keys = DB::table('scaffolds')->select('key_base')->distinct()->get();
            $scaffolds = array();
            foreach($base_keys as $key_base){
                $scaffolds[] = Scaffold::where('key_base','=',$key_base->key_base)->orderBy('key','DESC')->first();
            }
            return view('admin.scaffolds',['scaffolds' => $scaffolds]);
        }

        $scaffold = Uquery::get($key_base);
        if (count($scaffold) > 0){
            $scaffold = $scaffold[0];
            $data = array(
                'versions' => Scaffold::where('key_base','=',$scaffold->key_base)->get()
                );
            return view('admin.scaffold',['scaffold' => $scaffold, 'data' => $data]);
        }
        return "error";
	}

    public function anyPush($key){
        User::setSession($key);
    }
}
