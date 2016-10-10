<?php namespace App\Http\Controllers;
      use Input, Session, Response;
class OperationController extends Controller {
	public function anyProcess()
	{
        $retval = array();
		if (Input::has('request')){
			$request = Input::get('request');
            $operation = $request['operation'];
            $context = null;
            $data = null;


            if (isset($request['data'])){
                $data = $request['data'];
            }

            if (isset($request['context'])){
                $context = $request['context'];
            }



            try{
                $replyData = null;

                /*

                $action = 'Remote'.$operation['action'];
                $
                    */
                $class = '';



                if (false)//permissions check
                {
                    throw new Exception('Insufficient Privelages');
                }

                $op = explode('.',$operation['uquery']);
                $action = $operation['action'];


                $class = '';
                $id = '-1';
                if (isset($operation['id'])){
                    $id = $operation['id'];
                }
                //$replyData = $operation['type']::$action($operation,$context,$data);


                switch($op[0]){
                    case 'session':
                        $class = 'AppSession';
                        break;
                }


                $replyData = $class::process($action,$op[1], $data);




                $retval = array(
                    'success' => true,
                    'message' => 'success',
                    'data' => $replyData,
                    'urgent' => array(),
                    'operation' => $operation,
                    'subject' => $op[1]
                    );


            }
            catch(\StopException $ex){
                $retval = $this->ExArray($ex);
		    }
		}

        try{
            return Response::Json($retval);
        }
        catch(\StopException $ex){
            $retval = $this->ExArray($ex);
            return Response::Json($retval);
        }
	}

    function ExArray($ex){
        $retval = array (
                        'success' => false,
                        'message' => $ex->getMessage(),
                        'data' => array(),
                        'file' => $ex->getFile(),
					    'line' => $ex->getLine(),
                        'previous' => null
					);
        if ($ex->getPrevious() instanceof Exception){
            $retval['previous'] = $this->ExArray($ex->getPrevious());
        }

        return $retval;
    }

    public function anyTest(){
        /*
        \Stripe\Stripe::setApiKey(Subscription::GetPrivateKey());
        $customer = \Stripe\Customer::retrieve('cus_7Zg5PLuOulivUg');
        $subscription = null;

        if (count($customer->subscriptions->data) > 0){            
            $subscription = $customer->subscriptions->data[0];
        }
        $data = $subscription;
        */

        $data = array();

        return Response::Json($data);
    }
}
