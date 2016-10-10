<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateCompanyTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('companies', function($table)
		{
		    $table->increments('id');
            $table->string('guid');
            $table->string('title');
            $table->string('admin_email')->default('');
            $table->boolean('commercial')->default(false);
		    $table->string('settings')->default('{ }');
            $table->string('subscription_status')->default('');
            $table->integer('valid_until')->default(0);            
            $table->string('subscription_plan')->nullable();
            $table->string('customer_id')->nullable();
            $table->string('subscription_id')->nullable();
            $table->text('subscription_card')->nullable();
		    $table->timestamps();
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::drop('companies');
	}

}
